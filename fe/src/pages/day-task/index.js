import { useCallback, useEffect, useReducer, useState, useMemo } from "react";
import ParentContent from "../../components/parent-content";
import api from '../../services/api';
import utils from "../../services/utils";
import SurfaceLoading from '../../components/surface-loading';
import NotFoundSurface from '../../components/not-found-surface';
import { IoChevronBack, IoCalendarOutline, IoChevronForward } from 'react-icons/io5';
import './styles.css';
import { ErrorToast } from '../../components/toast';
import { useSearchParams } from "react-router-dom";
import ExpressionItem from "../../components/expression-item";
import CalendarPicker from "../../components/calendar-picker";

import { UserAnnotation, ExpressionBreadcrumb, InputNewItem, DailyScoreView } from './components';

const LS_INITIAL_LOADING = 0;
const LS_LOADED = 1;
const LS_ERROR = 2;
const LS_LOADING = 3;





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
   const [dailyScore, setDailyScore] = useState({ items: 0, valid_items: 0, goal: 0 });
   const [exprItems, dispatchExprItems] = useReducer(reducerExprItems, []);
   const [userAnnotation, setUserAnnotation] = useState({ key: 0, value: '' });
   const [screenState, setScreenState] = useState({ state: LS_INITIAL_LOADING, errorMessage: '' });
   const [selPeriod, setSelPeriod] = useState({ prior: false, others: false, day: new Date(), dayString: 'Terça-feira, xx de xxxx de xxxx' });
   const currentDate = useMemo(() => getDateFromURLParams(searchParams), [searchParams]);
   const [showCalendar, setShowCalendar] = useState(false);
   const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

   useEffect(() => {
      const cancelToken = api.getCancelToken();
      document.title = 'Mindword - Tarefa do dia - ' + utils.getDateToStrShow(currentDate, false, true);
      const fetchData = async () => {
         try {
            const ret = await api.get(`/expressions/day-task/${utils.getDateToURLParam(currentDate)}`);
            setDailyScore(ret.data.score);
            ret.data.items.reverse();
            dispatchExprItems({ type: 'set', values: ret.data.items });
            setUserAnnotation(p => ({ key: p.key + 1, value: ret.data.annotations }));
            const selDate = new Date(ret.data.period.day);
            setSelPeriod({ ...ret.data.period, day: selDate, dayString: utils.getDateToStrShow(selDate, false, true) });
            setScreenState({ state: LS_LOADED, errorMessage: '' });
         } catch (err) {
            if (!api.isCancel(err)) {
               setScreenState({ state: LS_ERROR, errorMessage: utils.getHTTPError(err) })
            }
         }
      }
      setScreenState(p => ({ ...p, state: p.state === LS_INITIAL_LOADING ? LS_INITIAL_LOADING : LS_LOADING }));
      fetchData();
      return () => cancelToken.cancel();
   }, [currentDate]);

   const handleItemAdded = useCallback(({ data, score }) => {
      dispatchExprItems({ type: 'append', value: data });
      setDailyScore(score);
   }, [dispatchExprItems, setDailyScore]);

   const handleItemChanged = useCallback(({ data, score }) => {
      dispatchExprItems({ type: 'update', value: data });
      setDailyScore(score);
   }, [dispatchExprItems, setDailyScore]);

   const handleItemDeleted = useCallback(({ data, score }) => {
      dispatchExprItems({ type: 'del', value: data });
      setDailyScore(score);
   }, [dispatchExprItems, setDailyScore]);

   const handleMoveCurrDate = useCallback((advance) => {
      const newDate = new Date(currentDate.getTime());
      newDate.setTime(newDate.getTime() + (1000 * 60 * 60 * 24 * (advance ? 1 : -1)));
      setSearchParams({ date: utils.getDateToURLParam(newDate) })
   }, [currentDate, setSearchParams]);

   const handleAddAnnotations = useCallback(async () => {
      try {
         const ret = await api.post('/expressions/fill-from-annotations', { current_day: currentDate });
         setUserAnnotation(p => ({ key: p.key + 1, value: ret.data.annotations }));
         setDailyScore(ret.data.score);
         dispatchExprItems({ type: 'append-multiple', values: ret.data.items })
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
      setCalendarPosition({ top: Math.floor(rect.bottom + 16), left: Math.floor(rect.left - 6) });
      setShowCalendar(true);
   }, [setCalendarPosition, setShowCalendar]);

   const handleSelectDate = useCallback((newDate) => {
      setSearchParams({ date: utils.getDateToURLParam(newDate) })
      setShowCalendar(false);
   }, [setSearchParams, setShowCalendar]);

   return (
      <ParentContent>
         <div className="day-task">
            {
               screenState.state === LS_INITIAL_LOADING ?
                  <SurfaceLoading /> :
                  (
                     screenState.state === LS_ERROR ?
                        <NotFoundSurface title="Algo deu errado" message={screenState.errorMessage} /> :
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
                                       <button className="btn-icon-shadow" onClick={showCalendar ? () => setShowCalendar(false) : handleShowCalendar}>
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
                                             <InputNewItem onItemAdded={handleItemAdded} currDay={selPeriod.day} />
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
                                       ) : <SurfaceLoading />
                                 }
                              </main>
                              <aside className="day-task-right">
                                 <DailyScoreView score={dailyScore} onRefreshScore={setDailyScore} currDay={selPeriod.day} />
                                 <UserAnnotation defaultValue={userAnnotation.value} key={userAnnotation.key} onAddFromAnnotation={handleAddAnnotations} />
                              </aside>
                           </>
                        )
                  )
            }
         </div>
      </ParentContent>
   )
}