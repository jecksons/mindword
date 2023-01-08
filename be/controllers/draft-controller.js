const { ErNotFound, ErBadRequest, ErUnprocEntity } = require("../services/error_classes");
const UtilsLib = require("../services/utils_lib");


const SQL_SEL_DRAFT = `
    select 
      df.id_draft,
      df.description,
      df.translation_meaning,
      df.created_at
    from 
      draft df 
    where 
      df.id_user = ?
      /*filter*/
    order by 
      df.id_draft desc	
`;


const SQL_INS_DRAFT = `
   INSERT INTO draft 
   (
      id_user, 
      description, 
      translation_meaning, 
      created_at
   )
   VALUES (?, ?, ?, ?)
`;

class DraftController {

   static getSaveOptions(data, idUser) {
      if (!data.description) {
         throw new ErBadRequest('Description is mandatory!');
      }
      if (!idUser) {
         throw new ErBadRequest('User is mandatory!');
      }
      if (!data.catalog_date) {
         data.catalog_date = UtilsLib.getTruncDate(new Date());
      }
      data.created_at = new Date();
      let sql = '';
      let values = [
         idUser,
         data.description.substr(0, 200),
         data.translation_meaning ? data.data.translation_meaning.substr(0, 200) : null, ,
         new Date()
      ];
      sql = SQL_INS_DRAFT;
      return { sql, values };
   }



   static async saveNt(data, idUser, conn) {
      const options = DraftController.getSaveOptions(data, idUser);
      const rows = await conn.query(options.sql, options.values);
      if (data.id > 0) {
         if (!(rows.affectedRows > 0)) {
            throw new ErNotFound('No expression found!');
         }
      } else {
         data.id = rows.insertId;
      }
      return data.id;
   }

   static async save(data, idUser, conn) {
      let transStarted = false;
      try {
         await conn.beginTransaction();
         transStarted = true;
         const ret = await DraftController.saveNt(data, idUser, conn);
         await conn.commit();
         return DraftController.getByIdNT(ret, idUser, conn);
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


   static async getByIdNT(idDraft, idUser, conn) {
      const itms = await DraftController.getByFilterNT('and df.id_draft = ?', [idDraft], idUser, conn);
      if (itms.length > 0) {
         return itms[0];
      }
      throw new ErNotFound('No expression found with this Id!');
   }

   static async getById(idDraft, idUser, conn) {
      try {
         return await DraftController.getByIdNT(idDraft, idUser, conn);
      }
      finally {
         await conn.close();
      }
   }

   static async remove(idDraft, idUser, conn) {
      let transStarted = false;
      try {
         await conn.beginTransaction();
         transStarted = true;
         const rows = await conn.query(`
                    delete from draft 
                    where id_draft = ?
                    and id_user = ?
                    `, [idDraft, idUser]);
         if (rows.affectedRows > 0) {
            return conn.commit();
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


   static async getByFilterNT(sqlFilter, sqlValues, idUser, conn) {
      const rows = await conn.query(SQL_SEL_DRAFT.replace('/*filter*/', sqlFilter), [idUser, ...sqlValues]);
      if (rows.length > 0) {
         return rows.map((itm) => ({
            id: itm.id_draft,
            description: itm.description,
            translation_meaning: itm.traslation_meaning,
            created_at: new Date(itm.created_at)
         }));
      }
      return [];
   }


   static async getAll(idUser, conn) {
      try {
         const ret = await DraftController.getByFilterNT('', [], idUser, conn);
         return ret;
      } finally {
         await conn.close();
      }
   }


   static getAllReq(req, res, conn) {
      DraftController.getAll(1, conn)
         .then((ret) => res.status(200).json(ret))
         .catch((err) => UtilsLib.resError(err, res));
   }

   static saveReq(req, res, conn) {
      DraftController.save(req.body, 1, conn)
         .then((ret) => res.status(200).json(ret))
         .catch((err) => UtilsLib.resError(err, res));
   }

   static deleteReq(req, res, conn) {
      DraftController.remove(req.params.id, 1, conn)
         .then((ret) => res.status(200).json(ret))
         .catch((err) => UtilsLib.resError(err, res));
   }


}

module.exports = DraftController;