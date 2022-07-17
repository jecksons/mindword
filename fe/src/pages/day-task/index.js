import { useCallback, useEffect, useReducer, useRef, useState, useMemo } from "react";
import Modal from 'react-modal';
import Calendar from 'react-calendar';
import ParentContent from "../../components/parent-content";
import api from '../../services/api';
import utils from "../../services/utils";
import SurfaceLoading from '../../components/surface-loading';
import NotFoundSurface from '../../components/not-found-surface';
import {IoChevronBack, IoCalendarOutline, IoChevronForward} from 'react-icons/io5';
import { Link } from 'react-scroll';
import './styles.css';
import ButtonAction from "../../components/button-action";
import { ErrorToast } from '../../components/toast';
import { useLocalStorage } from "../../hooks/utils-hooks";
import { useSearchParams } from "react-router-dom";
import ExpressionItem from "../../components/expression-item";


const LS_INITIAL_LOADING = 0;
const LS_LOADED = 1;
const LS_ERROR = 2;
const LS_LOADING = 3;


function ExpressionBreadcrumb({item}) {

    return (
        <li className="col align-end margin-1-b">
            <Link to={`expr-${item.id}`} className="color-black-3 margin-05-b btn-link" smooth={true} offset={-100}  >{item.description}</Link>
            <label className="color-grey font-75" >{item.meaning}</label>
        </li>        
    )
}

function UserAnnotation({defaultValue, onAddFromAnnotation}) {

    const [currValue, setCurrValue] = useState(defaultValue ?? '');
    const [localHeight, setLocalHeight] = useLocalStorage('annotation-height', 0);
    const refTimerSave = useRef(null);
    const refAnnotation = useRef(null);
    const [addingExpressions, setAddingExpressions] = useState(false);
    const handleResizeMemo = useCallback((entries) => {
        if (entries.length > 0) {
            setLocalHeight(entries[0].contentRect.height);
        }        
    }, [setLocalHeight]);
    const refResizeObserver = useRef(new ResizeObserver(handleResizeMemo))

    useEffect(() => {
        const currRef = refAnnotation.current;
        if (parseInt(localHeight) > 0) {
            refAnnotation.current.style.height = localHeight + 'px';
        }
        const currObserve = refResizeObserver.current;
        currObserve.observe(currRef);
        return () => currObserve.unobserve(currRef);        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refAnnotation, refResizeObserver]);    

    const handleChange = useCallback((e) => {
        setCurrValue(e.target.value);        
        if (refTimerSave.current) {
            clearTimeout(refTimerSave.current);
            refTimerSave.current = null;
        }
        refTimerSave.current = setTimeout(() => {
            api.post('/expressions/user-annotation', {
                annotation: e.target.value
            })
            .catch((err) => {
                ErrorToast.fire(
                    {
                        title: 'Erro ao salvar anotações',
                        text: utils.getHTTPError(err),
                        icon: 'error'
                    }
                );
            });
        }, 500);
    }, [setCurrValue, refTimerSave]);

    const handleAddFromAnnotations = useCallback(() => {
        setAddingExpressions(true);
        onAddFromAnnotation()
        .then(() => setAddingExpressions(false));
    }, [setAddingExpressions, onAddFromAnnotation]);

    return (
        <div className="col width-100">
            <section className="user-annotations">
                <header className="row">
                    <h3>Anotações</h3>
                    <label className="color-grey font-75">{currValue.length > 0 ? `${Math.floor(currValue.length / 2000 * 100)}%` : ' '}</label>
                </header>
                <textarea
                    value={currValue}                
                    maxLength={2000}                
                    ref={refAnnotation}            
                    onChange={handleChange}                    
                />            
                <button className="btn-link margin-1-b" onClick={() => handleChange({target: {value: ''}}) }>Limpar</button>
            </section>
            <ButtonAction 
                primary={false}
                caption="Usar as expressões das anotações"
                fullSize={true}
                processing={addingExpressions}
                onClick={handleAddFromAnnotations}
            />
        </div>
    );
}




function InputNewItem({onItemAdded, currDay}) {

    const [exprText, setExprText] = useState('');
    const [posting, setPosting] = useState(false);
    const refInput = useRef(null);

    const handleAddItem = useCallback(() => {
        if (exprText !== '') {
            setPosting(true);                        
            api.post('/expressions', {description: exprText, catalog_date: currDay})
            .then((ret) => {
                setPosting(false);
                setExprText('');
                onItemAdded(ret.data);
                refInput.current.focus();
            })
            .catch((err) => {
                setPosting(false);
                ErrorToast.fire(
                    {
                        title: 'Erro ao adicionar expressão',
                        text: utils.getHTTPError(err),
                        icon: 'error'
                    }
                );
            });
        }
    }, [setPosting, onItemAdded, exprText, setExprText, refInput, currDay]);

    return (
        <div className="col-05 width-100 margin-2-b new-expression ">
            <label>Nova expressão</label>
            <div className="row width-100">
                <input 
                    className="flex-1 font-87"  
                    value={exprText}
                    ref={refInput}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter') {
                            handleAddItem();
                        }                        
                    }}
                    onChange={(e) => setExprText(e.target.value)}
                    placeholder="Escreva uma nova expressão para adicioná-la à lista" 
                    autoFocus={true}
                />                                 
            </div>
            <ButtonAction
                fullSize={true} 
                disabled={exprText === ''}  
                processing={posting}
                onClick={handleAddItem}
                caption="Adicionar" />
        </div>
    )
}


function CalendarPicker({defaultValue, onChange, onRequestClose, position}) {

    return (
        <Modal 
            isOpen={true}
            onRequestClose={onRequestClose}
            overlayClassName={'overlay-dialog overlay-transparent'}
            style={position ? 
                {
                    content: {
                        position: 'absolute',
                        top: position.top + 'px',
                        left: position.left + 'px',
                        transform: 'none',
                      }
                } : {}
            }
            className={'dialog-content-fixed'} >
            <section className='modal-content col-05 calendar-parent '>
                <Calendar  onChange={onChange} defaultValue={defaultValue} />
            </section>           
      </Modal>
    )
}


function ChangeGoalModal({currGoal, onSaved, onRequestClose, position, currDay}) {

    const [newGoal, setNewGoal] = useState(currGoal);    
    const [posting, setPosting] = useState(false);

    const handleSaveNewGoal = useCallback(() => {
        if (newGoal > 0) {
            setPosting(true);        
            api.post('/expressions/daily-goal', {
                current_day: currDay, 
                goal: newGoal
            })
            .then((ret) => {
                onSaved(ret.data.score);
                onRequestClose();
            })
            .catch((err) => {
                setPosting(false);
                ErrorToast.fire(
                    {
                        title: 'Erro ao adicionar expressão',
                        text: utils.getHTTPError(err),
                        icon: 'error'
                    }
                );                
            });
        }        
    }, [newGoal, setPosting, currDay, onSaved, onRequestClose]);

    return (
        <Modal 
            isOpen={true}
            onRequestClose={onRequestClose}
            overlayClassName={'overlay-dialog overlay-transparent'}
            style={position ? 
                {
                    content: {
                        position: 'absolute',
                        top: position.top + 'px',
                        right: 'calc(100vw - ' + position.right + 'px)',
                        transform: 'none',
                      }
                } : {}
            }
            className={'dialog-content-fixed'} >
            <section className='modal-content col-05 '>
                <div className="change-goal-menu col min-width-8">
                    <label className="font-87 color-grey margin-1-b">Metal atual: {currGoal}</label>
                    <label className="font-75 color-black-2">Nova meta:</label>
                    <input  
                        type={"number"}  
                        autoFocus={true}
                        value={newGoal}                     
                        onChange={(e) => setNewGoal(parseInt(e.target.value) >= 0 ? parseInt(e.target.value) : '')} />
                    <ButtonAction
                        caption="Aplicar"                          
                        onClick={handleSaveNewGoal}  
                        fullSize={true}
                        disabled={!(parseInt(newGoal) > 0)} 
                        processing={posting} />                                
                </div>                
            </section>           
      </Modal>
    )
}



function DailyScoreView({score, onRefreshScore, currDay}) {

    const completedPerc = score.valid_items >= score.goal ? 100 : Math.floor(score.valid_items / score.goal * 100);
    const pendingPerc = score.valid_items >= score.goal ? 0 : (
        Math.floor(
        (
            (score.items > score.goal) ? 
                (score.goal - score.valid_items) : 
                (score.items - score.valid_items)
        ) / score.goal * 100)
    );
    const completedBorderRadius = completedPerc > 0 ?
                                    (
                                        pendingPerc > 0 ? 
                                            '20px 0 0 20px' : 
                                            '20px'
                                    ) : '0';
    const pendingBorderRadius = pendingPerc > 0 ?
    (
        completedPerc > 0 ? 
            '0 20px 20px 0' : 
            '20px'
    ) : '0';                                    

    const [showChangeGoal, setShowChangeGoal] = useState(false);
    const [posModalChange, setPosModalChange] = useState({top: 0, right: 0});
    

    const handleShowNewGoal = useCallback((target) => {
        const rect = target.getBoundingClientRect();
        setPosModalChange({top: Math.floor(rect.bottom + 8), right: Math.floor(rect.right + 8) });
        setShowChangeGoal(true);
    }, []);

    return (
        <section className="col align-end pos-relative">
            <button className="btn-link" onClick={(e) => showChangeGoal ? setShowChangeGoal(false) : handleShowNewGoal(e.target)}  >Alterar a meta diária</button>            
            {score.goal > 0 &&
                (
                    <div className="score-progress-parent">
                        <div className="score-progress" 
                            style={{
                                '--progress-complete': completedPerc + '%',
                                '--pending-items': pendingPerc + "%",
                                '--complete-border-radius': completedBorderRadius,
                                '--pending-border-radius': pendingBorderRadius
                            }}
                             > </div>
                    </div>
                )
            }
            <label className={'font-bold font-87 color-black-3'}>
                {`${score.valid_items}/${score.goal}`}
            </label>
            {showChangeGoal && <ChangeGoalModal  
                onRequestClose={() => setShowChangeGoal(false)} 
                currGoal={score.goal} 
                currDay={currDay}
                onSaved={onRefreshScore}
                position={posModalChange} />}             
        </section>
    )
}

function reducerExprItems(state, action) {
    switch (action.type) {
        case 'set': {
            return action.values;
        }
        case 'append': {
            return [action.value, ...state]
        }
        case 'append-multiple': {
            return [...action.values, ...state]
        }
        case 'del': {
            return state.filter((itm) => itm.id !== action.value.id);
        }
        case 'update': {
            return state.map((itm) => itm.id === action.value.id ? action.value : itm);
        }
        default: throw new Error('Unespected action!');
    }
}

function getDateFromURLParams(searchParams) {
    const str = searchParams.get('date');
    if (str && str.length === 10) {
        return new Date(str + ' 00:00:00');
    }
    return new Date();
}

export default function DayTask(props) {

    const [searchParams, setSearchParams] = useSearchParams();
    const [dailyScore, setDailyScore] = useState({items: 0, valid_items: 0, goal: 0});
    const [exprItems, dispatchExprItems] = useReducer(reducerExprItems, []);
    const [userAnnotation, setUserAnnotation] = useState({key: 0, value: ''});
    const [screenState, setScreenState] = useState({state: LS_INITIAL_LOADING, errorMessage: ''});
    const [selPeriod, setSelPeriod] = useState({prior: false, others: false, day: new Date(), dayString: 'Terça-feira, xx de xxxx de xxxx'});    
    const currentDate = useMemo(() => getDateFromURLParams(searchParams), [searchParams]);        
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarPosition, setCalendarPosition] = useState({top: 0, left: 0});

    useEffect(() => {                
        const cancelToken = api.getCancelToken();
        document.title = 'Mindword - Tarefa do dia - ' + utils.getDateToStrShow(currentDate, false, true);
        const fetchData = async () => {
            try {                
                const ret = await api.get(`/expressions/day-task/${utils.getDateToURLParam(currentDate)}`);
                setDailyScore(ret.data.score);
                ret.data.items.reverse();
                dispatchExprItems({type: 'set', values: ret.data.items});                
                setUserAnnotation(p => ({key: p.key + 1, value: ret.data.annotations}));
                const selDate = new Date(ret.data.period.day);
                setSelPeriod({...ret.data.period, day: selDate, dayString: utils.getDateToStrShow(selDate, false, true)});
                setScreenState({state: LS_LOADED, errorMessage: ''});
            } catch (err) {
                if (!api.isCancel(err)) {
                    setScreenState({state: LS_ERROR, errorMessage: utils.getHTTPError(err)})
                }
            }
        }
        setScreenState(p =>  ({...p, state: p.state === LS_INITIAL_LOADING ? LS_INITIAL_LOADING : LS_LOADING}));
        fetchData();
        return () => cancelToken.cancel();
    }, [currentDate]);

    const handleItemAdded = useCallback(({data, score}) => {
        dispatchExprItems({type: 'append', value: data});
        setDailyScore(score);        
    }, [dispatchExprItems, setDailyScore]);

    const handleItemChanged = useCallback(({data, score}) => {
        dispatchExprItems({type: 'update', value: data});
        setDailyScore(score);        
    }, [dispatchExprItems, setDailyScore]);

    const handleItemDeleted = useCallback(({data, score}) => {
        dispatchExprItems({type: 'del', value: data});
        setDailyScore(score);        
    }, [dispatchExprItems, setDailyScore]);    

    const handleMoveCurrDate = useCallback((advance) => {
        const newDate = new Date(currentDate.getTime());
        newDate.setTime(newDate.getTime() + (1000 * 60 * 60 * 24 * (advance ? 1 : -1)));
        setSearchParams({date: utils.getDateToURLParam(newDate)})
    }, [currentDate, setSearchParams]);

    const handleAddAnnotations = useCallback(async () => {        
        try {
            const ret = await api.post('/expressions/fill-from-annotations', {current_day: currentDate});
            setUserAnnotation(p => ({key: p.key + 1, value: ret.data.annotations}));
            setDailyScore(ret.data.score);
            dispatchExprItems({type: 'append-multiple', values: ret.data.items})
        } catch (err) {
            if (err?.response) {
                if (err.response.status === 422) {
                    ErrorToast.fire(
                        {
                            title: 'Não foi possível adicionar expressões',
                            text: utils.getHTTPError(err),
                            icon: 'warning'
                        }
                    );                
                    return;
                }
            }
            ErrorToast.fire(
                {
                    title: 'Erro ao adicionar expressões',
                    text: utils.getHTTPError(err),
                    icon: 'error'
                }
            );                
        }
    }, [currentDate, dispatchExprItems, setDailyScore, setUserAnnotation]);

    const handleShowCalendar = useCallback((e) => {
        const rect = e.target.getBoundingClientRect();
        setCalendarPosition({top: Math.floor(rect.bottom + 16), left: Math.floor(rect.left - 6) });
        setShowCalendar(true);        
    }, [setCalendarPosition, setShowCalendar]) ;
    
    const handleSelectDate = useCallback((newDate) => {
        setSearchParams({date: utils.getDateToURLParam(newDate)})
        setShowCalendar(false);
    }, [setSearchParams, setShowCalendar]);

    return (
        <ParentContent>
            <div className="day-task">
                {
                    screenState.state === LS_INITIAL_LOADING ? 
                        <SurfaceLoading  /> :
                        (
                            screenState.state === LS_ERROR ? 
                                <NotFoundSurface  title="Algo deu errado"  message={screenState.errorMessage} /> : 
                                (
                                    <>
                                        <aside className="day-task-left">
                                            <ul >
                                                {exprItems.map((itm) => <ExpressionBreadcrumb item={itm} key={itm.id} />)}                                                
                                            </ul>                                        
                                        </aside>
                                        <main className="parent-expressions">
                                            <header>
                                                <h2 className="day-title">{selPeriod.dayString}</h2>
                                                <div className="row just-start margin-2-b">
                                                    <button className="btn-icon-shadow margin-05-r" onClick={() => handleMoveCurrDate(false)} >
                                                        <IoChevronBack size={24} />                                                        
                                                    </button> 
                                                    <button className="btn-icon-shadow margin-05-r" onClick={() => handleMoveCurrDate(true)} >
                                                        <IoChevronForward size={24} />                                                        
                                                    </button>                                                     
                                                    <button className="btn-icon-shadow" onClick={showCalendar ? () => setShowCalendar(false) : handleShowCalendar }>
                                                        <IoCalendarOutline size={24} />
                                                    </button>                                                    
                                                    {showCalendar && <CalendarPicker  
                                                        defaultValue={currentDate} 
                                                        onChange={handleSelectDate} 
                                                        onRequestClose={() => setShowCalendar(false)} 
                                                        position={calendarPosition}
                                                        />}                                                    
                                                </div>
                                            </header>
                                            {
                                                screenState.state === LS_LOADED ? 
                                                    (
                                                        <ul>
                                                            <InputNewItem  onItemAdded={handleItemAdded} currDay={selPeriod.day}  />
                                                            {
                                                                exprItems.length > 0 ? 
                                                                    exprItems.map((itm) => <ExpressionItem 
                                                                        item={itm} 
                                                                        key={itm.id} 
                                                                        onItemChanged={handleItemChanged}
                                                                        onItemDeleted={handleItemDeleted}
                                                                    />) : 
                                                                    <div className="no-expression">
                                                                        <label>Nenhuma expressão adicionada nesse dia</label>
                                                                    </div>
                                                            }                                                
                                                        </ul>                                        
                                                    ) : <SurfaceLoading  />
                                            }                                            
                                        </main>
                                        <aside className="day-task-right">
                                            <DailyScoreView score={dailyScore} onRefreshScore={setDailyScore} currDay={selPeriod.day} />                                             
                                            <UserAnnotation  defaultValue={userAnnotation.value} key={userAnnotation.key} onAddFromAnnotation={handleAddAnnotations}  /> 
                                        </aside>
                                    </>                                    
                                )                                
                        )                        
                }
            </div>
        </ParentContent>
    )
}