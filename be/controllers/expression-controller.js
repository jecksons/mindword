const { ErNotFound, ErBadRequest, ErUnprocEntity } = require("../services/error_classes");
const UtilsLib = require("../services/utils_lib");

const SQL_SEL_EXPR = `
        select 
            epr.id_expression,
            epr.description,
            epr.meaning,
            epr.example_phrase,
            epr.synonyms,
            epr.valid,
            epr.catalog_date
        from 
            expression epr
        where
            epr.id_user = ?
            /*filter*/
        order by
            epr.id_expression
`;

const SQL_INS_EXPR = `
        insert into expression
        (
            description,
            meaning,
            example_phrase,
            synonyms,
            valid,
            catalog_date,
            id_user
        )
        values(?, ?, ?, ?, ?, ?, ?)
    `;

const SQL_UPD_EXPR = `
        update 
            expression
        set    
            description = ?,
            meaning = ?,
            example_phrase = ?,
            synonyms = ?,
            valid = ?,
            catalog_date = ?
        where
            id_user = ?
            and id_expression = ?
    ` ;

const SQL_SEL_SCORE = `
        with
            goa as
            (
                select
                    a.goal,
                    a.id_user
                from
                    (   
                        select 
                            row_number() over(order by goa.start_date desc) rn,
                            goa.goal,
                            goa.id_user
                        from 
                            user_goal goa
                        where
                            goa.id_user = ?
                            and goa.start_date <= ?
                    ) a
                where
                    a.rn = 1
            ),
            rea as
            (
                select
                    count(1) items,
                    sum(exp.valid) valid_items,
                    exp.id_user
                from
                    expression exp
                where
                    exp.id_user = ?
                    and exp.catalog_date = ?
            )
        select
            ifnull(rea.items, 0) items,
            ifnull(rea.valid_items, 0) valid_items,
            goa.goal
        from
            goa
        left join rea on (rea.id_user = goa.id_user)
    `;

const SQL_SEL_USER_ANNOTATION = `
        select 
            usr.annotations 
        from 
            user usr
        where
            usr.id_user = ?
    `;

const SQL_UPD_USER_ANNOTATION = `
    update
        user usr        
    set
        usr.annotations  = ?
    where
        usr.id_user = ?
`;


const SQL_SEL_OTHER_DAYS = `
    select 
        case 
            when exists
                    (
                        select
                            1
                        from 
                            expression epr
                        where
                            epr.id_user = ?
                            and epr.catalog_date < ?
                    ) then
                1
            else
                0
        end exists_prior,
        case 
            when exists
                    (
                        select
                            1
                        from 
                            expression epr
                        where
                            epr.id_user = ?
                            and epr.catalog_date <> ?
                    ) then
                1
            else
                0
        end exists_others
    `;

const SQL_UPD_GOAL = `
    update 
        user_goal 
    set 
        goal = ?
    where
        id_user = ?
        and start_date = ?
    `;

const SQL_INS_GOAL = `
    insert into user_goal
    (
        goal,
        id_user,
        start_date
    )   
    values(?, ?, ?)
`;

const SQL_SEL_VOCABULARY = `
    with
        epr as
        (
            select 
                epr.id_expression,
                epr.description,
                epr.meaning,
                epr.catalog_date,
                upper(substr(epr.description, 1, 1)) initial
            from 
                expression epr
            where
                epr.id_user = ?
                and epr.valid = 1
        ),
        agp as
        (
            select 
                epr.*,
                row_number() over(
                    order by 
                        /*sort_field*/,
                        upper(epr.description)
                ) rn,
                count(1) over() rn_total,
                row_number() over(
                    partition by 
                        /*sort_field*/
                    order by             
                        upper(epr.description)
                ) rn_section
            from 
                epr   
            where
                1=1
                /*filter*/
        )
    select
        agp.*
    from
        agp
    where
        agp.rn between ? and ?
    order by
        agp.rn
    `;

const SQL_SEL_VOCABULARY_INDEX = `
    with
        epr as
        (
            select 
                epr.id_expression,
                epr.description,
                epr.meaning,
                epr.catalog_date,
                upper(substr(epr.description, 1, 1)) initial
            from 
                expression epr
            where
                epr.id_user = ?
                and epr.valid = 1   
        )
    select
        /*sort_field*/ description,
        count(1) total
    from
        epr
    where
        1=1
        /*filter*/        
    group by 
        epr.initial
    order by 
        1   
`;

class ExpressionController{

    static getSaveOptions(data, idUser) {
        if (!data.description) {
            throw new ErBadRequest('Description is mandatory!');
        }
        if (!idUser) {
            throw new ErBadRequest('User is mandatory!');
        }
        if (!data.catalog_date) {
            data.catalog_date  = UtilsLib.getTruncDate(new Date());
        }
        if (typeof data.catalog_date !== 'object') {
            data.catalog_date  = UtilsLib.getTruncDate(new Date(data.catalog_date));
        }        
        let sql = '';
        let values = [
            data.description.substr(0, 200),
            data.meaning ? data.meaning.substr(0, 200) : null,
            data.example_phrase ? data.example_phrase.substr(0, 2000) : null,
            data.synonyms ? data.synonyms.substr(0, 200)  : null,
            (data.meaning  && data.example_phrase) ? 1 : 0,
            data.catalog_date,
            idUser
        ];
        sql = SQL_INS_EXPR;            
        if (data.id > 0) {
            sql = SQL_UPD_EXPR;
            values.push(data.id);
        }         
        return {sql, values};
    }

    static async getDayScore(idUser, scoreDate, conn) {
        const rows = await conn.query(SQL_SEL_SCORE, [idUser, scoreDate, idUser, scoreDate]);
        let score = {
            items: 0,
            valid_items: 0,
            goal: 0
        }
        if (rows.length > 0) {
            score.items = rows[0].items;
            score.valid_items = rows[0].valid_items;
            score.goal = rows[0].goal;
        }
        return score;
    }

    static async updateDailyGoal(data, idUser, conn) {
        let transStarted = false;
        try {
            const { current_day, goal } = data;
            let dayDate = new Date(current_day);            
            const values = [goal, idUser, dayDate];
            await conn.beginTransaction();
            transStarted = true;
            let rows = await conn.query(SQL_UPD_GOAL, values);
            if (!(rows.affectedRows > 0)) {
                rows = await conn.query(SQL_INS_GOAL, values);                
            }
            await conn.commit();
            const score = await ExpressionController.getDayScore(idUser, dayDate, conn);
            return { score };
        }
        catch (err) {
            if (transStarted) {
                await conn.rollback();
            }
            throw err;
        }
        finally {
            await conn.close();
        }
    }

    static async fillExpressionsFromAnnotations(data, idUser, conn) {
        let transStarted = false;
        try {
            const { current_day } = data;
            let dayDate = UtilsLib.getTruncDate(new Date(current_day));                        
            let score = await ExpressionController.getDayScore(idUser, dayDate, conn);
            let annotations = await ExpressionController.getUserAnnotation(idUser, conn);
            if (score.items >= score.goal) {
                throw new ErUnprocEntity('Nenhum item a adicionar. \nA meta diária já foi alcançada!');
            }
            if (!annotations) {
                throw new ErUnprocEntity('Nenhum item nas anotações!');
            }
            const addedItems = [];
            const anItems = annotations.split('\n');
            await conn.beginTransaction();
            transStarted = true;
            while (score.items < score.goal) {
                while (anItems.length > 0 && anItems[0].replaceAll(' ', '') === '') {
                    anItems.splice(0, 1);
                }
                if (anItems.length === 0) {
                    break;
                }
                const exprSave = anItems[0];
                anItems.splice(0, 1);
                const svData = await ExpressionController.saveNt({
                    description: exprSave,
                    catalog_date: dayDate
                }, idUser, conn);
                addedItems.push(svData.data);
                score = svData.score;
            }
            if (addedItems.length === 0) {
                throw new ErUnprocEntity('Nenhum item nas anotações!');
            }
            annotations = anItems.join('\n');
            await ExpressionController.saveUserAnnotationNT({annotation: annotations}, idUser, conn);
            await conn.commit();
            return {
                items: addedItems,
                score,
                annotations
            }            
        }
        catch (err) {
            if (transStarted) {
                await conn.rollback();
            }
            throw err;
        }
        finally {
            await conn.close();
        }
    }  

    static async saveNt(data, idUser, conn) {
        const options = ExpressionController.getSaveOptions(data, idUser);
        const rows = await conn.query(options.sql, options.values);
        if (data.id > 0) {
            if (!(rows.affectedRows > 0)) {
                throw new ErNotFound('No expression found!');                                
            }
        } else {
            data.id = rows.insertId;                
        }            
        const savedData = await ExpressionController.getByIdNT(data.id, idUser, conn);
        const score = await ExpressionController.getDayScore(idUser, savedData.catalog_date, conn);
        return {
            data: savedData,
            score
        }
    }

    static async save(data, idUser, conn) {        
        let transStarted = false;
        try {            
            await conn.beginTransaction();
            transStarted = true;
            const ret = await ExpressionController.saveNt(data, idUser, conn);
            await conn.commit();            
            return ret;
        } 
        catch (err) {
            if (transStarted) {
                await conn.rollback();
            }
            throw err;
        }
        finally {
            await conn.close();
        }
    }


    static async saveUserAnnotationNT(data, idUser, conn) {        
        const rows = await conn.query(SQL_UPD_USER_ANNOTATION, [data.annotation, idUser]);
        if (!(rows.affectedRows > 0)) {
            throw new ErNotFound('User not found!');                                            
        }        
    }


    static async saveUserAnnotation(data, idUser, conn) {        
        let transStarted = false;
        try {            
            await conn.beginTransaction();
            transStarted = true;
            await ExpressionController.saveUserAnnotationNT(data, idUser, conn);
            await conn.commit();            
            return {
                message: 'Saved'
            }
        } 
        catch (err) {
            if (transStarted) {
                await conn.rollback();
            }
            throw err;
        }
        finally {
            await conn.close();
        }
    }

    

    static async getByFilterNT(sqlFilter, sqlValues, idUser, conn) {
        const rows = await conn.query(SQL_SEL_EXPR.replace('/*filter*/', sqlFilter), [idUser, ...sqlValues]);
        if (rows.length > 0) {
            return rows.map((itm) => ({
                id: itm.id_expression,
                description: itm.description,
                meaning: itm.meaning,
                example_phrase: itm.example_phrase,
                synonyms: itm.synonyms,
                valid: itm.valid !== 0,
                catalog_date: new Date(itm.catalog_date)
            }));
        }
        return [];
    }


    static async getByIdNT(idExpression, idUser, conn) {        
        const itms = await ExpressionController.getByFilterNT('and epr.id_expression = ?', [idExpression], idUser, conn);
        if (itms.length > 0) {
            return itms[0];
        }
        throw new ErNotFound('No expression found with this Id!');
    }

    static async getById(idExpression, idUser, conn) {
        try {
            return await ExpressionController.getByIdNT(idExpression, idUser, conn);
        }
        finally{
            await conn.close();
        }        
    }

    static async remove(idExpression, idUser, conn) {
        let transStarted = false;
        try {
            await conn.beginTransaction();
            transStarted = true;
            const originalItem = await ExpressionController.getByIdNT(idExpression, idUser, conn);
            const rows = await conn.query(`
                    delete from expression 
                    where id_expression = ?
                    and id_user = ?
                    `, [idExpression, idUser]);
            if (rows.affectedRows > 0) {
                await conn.commit();
                const score = await ExpressionController.getDayScore(idUser, originalItem.catalog_date, conn);
                return {score};
            }
            throw new ErNotFound('No expression found!');            
        } 
        catch (err) {
            if (transStarted) {
                await conn.rollback();
            }
            throw err;
        }
        finally {
            await conn.close();
        }
    }

    static async getUserAnnotation(idUser, conn) {
        const rows = await conn.query(SQL_SEL_USER_ANNOTATION, [idUser]);
        if (rows.length > 0) {
            return rows[0].annotations;
        }
        return null;
    }


    static async getOtherDaysData(idUser, dayDt, conn) {
        const rows = await conn.query(SQL_SEL_OTHER_DAYS, [idUser, dayDt, idUser, dayDt]);
        const ret = {
            prior: false,
            others: false,
            day: dayDt
        };
        if (rows.length > 0) {            
            ret.prior = rows[0].exists_prior !== 0;
            ret.others = rows[0].exists_others !== 0;
        }
        return ret;
    }


    static async getVocabulary(idUser, query, conn) {
        try {
            const metadata = {
                total: 0,
                count: 0,
                limit: parseInt(query.limit) >= 0 ? parseInt(query.limit) : 20,
                offset: parseInt(query.offset) >= 0 ? parseInt(query.offset) : 0
            };
            const sortField = query.showby === 'catalog_date' ? 'epr.catalog_date' : 'epr.initial';
            const values = [idUser];
            let sqlFilter = ' ';
            if (query.searchtext && typeof query.searchtext === 'string') {
                values.push(`%${query.searchtext.replaceAll(' ', '%').toUpperCase()}%`);
                sqlFilter = 'and upper(epr.description) like ?';
            }
            let sql = SQL_SEL_VOCABULARY.replaceAll('/*sort_field*/', sortField);
            sql = sql.replaceAll('/*filter*/', sqlFilter);            
            values.push(metadata.offset + 1, metadata.offset + metadata.limit);            
            const rows = await conn.query(sql,  values);
            let results = [];
            if (rows.length > 0) {
                metadata.total = rows[0].rn_total;
                metadata.count = rows.length;
                results = rows.map((itm) => {
                    const itRet = {
                        id: itm.id_expression,
                        description: itm.description,
                        meaning: itm.meaning,                
                    };
                    if (itm.rn_section === 1) {
                        itRet.begin_section = query.showby === 'catalog_date' ? itm.catalog_date : itm.initial
                    }
                    return itRet;
                });
            }                        
            return {
                metadata,
                results
            };
        }
        finally {
            await conn.close();
        }
    }


    static async getVocabularyIndex(idUser, query, conn) {
        try {
            const sortField = query.showby === 'catalog_date' ? 'epr.catalog_date' : 'epr.initial';
            const values = [idUser];
            let sqlFilter = ' ';
            if (query.searchtext && typeof query.searchtext === 'string') {
                values.push(`%${query.searchtext.replaceAll(' ', '%').toUpperCase()}%`);
                sqlFilter = 'and upper(epr.description) like ?';
            }
            let sql = SQL_SEL_VOCABULARY_INDEX.replaceAll('/*sort_field*/', sortField);
            sql = sql.replaceAll('/*filter*/', sqlFilter);
            const rows = await conn.query(sql, 
                values);
            const results = rows.reduce((prev, itm) => {
                prev.results.push({                
                    description: itm.description,
                    total: itm.total
                });
                prev.total += itm.total;
                return prev;
            }, {
                results: [],
                total: 0
            });
            return results;
        }
        finally {
            await conn.close();
        }
    }
    
    

    static async getDayTask(idUser, day, conn) {
        try {
            let dayDate;
            if (typeof day === 'string') {
                if (!UtilsLib.strIsValidDate(day)) {
                    throw new ErBadRequest('Invalid date format!');
                }
                dayDate = new Date(day + ' 00:00:00');
            } else {
                throw new ErBadRequest('Invalid date format!');
            }
            const score = await ExpressionController.getDayScore(idUser, dayDate, conn);
            const items = await ExpressionController.getByFilterNT('and epr.catalog_date = ?', [dayDate], idUser, conn);
            const annotations = await ExpressionController.getUserAnnotation(idUser, conn);
            const period = await ExpressionController.getOtherDaysData(idUser, dayDate, conn);
            return {
                score, 
                items,
                annotations,
                period 
            };
        } 
        finally {
            await conn.close();
        }
    }

    static getDayTaskReq(req, res, conn) {
        ExpressionController.getDayTask(1, req.params.day, conn) 
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static saveReq(req, res, conn) {
        ExpressionController.save(req.body, 1, conn) 
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static deleteReq(req, res, conn) {
        ExpressionController.remove(req.params.id, 1, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static saveUserAnnotationReq(req, res, conn) {
        ExpressionController.saveUserAnnotation(req.body, 1, conn) 
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static updateDailyGoalReq(req, res, conn) {
        ExpressionController.updateDailyGoal(req.body, 1, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static fillExpressionsFromAnnotationsReq(req, res, conn) {
        ExpressionController.fillExpressionsFromAnnotations(req.body, 1, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static getVocabularyReq(req, res, conn) {
        ExpressionController.getVocabulary(1, req.query, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static getVocabularyIndexReq(req, res, conn) {
        ExpressionController.getVocabularyIndex(1, req.query, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }

    static getByIdReq(req, res, conn) {
        ExpressionController.getById(parseInt(req.params.id), 1, conn)
        .then((ret) => res.status(200).json(ret))
        .catch((err) => UtilsLib.resError(err, res));
    }


}

module.exports = ExpressionController;