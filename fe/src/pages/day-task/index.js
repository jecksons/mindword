import { useCallback, useEffect, useState, useMemo } from "react";
import ParentContent from "../../components/parent-content";
import utils from "../../services/utils";
import SurfaceLoading from '../../components/surface-loading';
import NotFoundSurface from '../../components/not-found-surface';
import { IoChevronBack, IoCalendarOutline, IoChevronForward } from 'react-icons/io5';
import './styles.css';
import { useSearchParams } from "react-router-dom";
import ExpressionItem from "../../components/expression-item";
import CalendarPicker from "../../components/calendar-picker";
import { ExpressionBreadcrumb, InputNewItem, DailyScoreView, DraftList } from './components';
import { DayTaskProvider, useDayTask } from "../../store/day-task-context";
import ButtonAction from "../../components/button-action";

const LS_INITIAL_LOADING = 0;
const LS_LOADED = 1;
const LS_ERROR = 2;
const LS_LOADING = 3;


function getDateFromURLParams(searchParams) {
   const str = searchParams.get('date');
   if (str && str.length === 10) {
      return new Date(str + ' 00:00:00');
   }
   return new Date();
}



const InnerDayTask = () => {

   const [searchParams, setSearchParams] = useSearchParams();
   const [screenState, setScreenState] = useState({ state: LS_INITIAL_LOADING, errorMessage: '' });
   const currentDate = useMemo(() => getDateFromURLParams(searchParams), [searchParams]);
   const [showCalendar, setShowCalendar] = useState(false);
   const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
   const { fetchDay, exprItems, selPeriod } = useDayTask();
   const [showDrafts, setShowDrafts] = useState(false);

   useEffect(() => {
      const controller = new AbortController();
      document.title = 'Mindword - Tarefa do dia - ' + utils.getDateToStrShow(currentDate, false, true);
      const fetchData = async () => {
         try {
            await fetchDay(currentDate, controller.signal);
            setScreenState({ state: LS_LOADED, errorMessage: '' });
         } catch (err) {
            setScreenState({ state: LS_ERROR, errorMessage: utils.getHTTPError(err) })
         }
      }
      setScreenState(p => ({ ...p, state: p.state === LS_INITIAL_LOADING ? LS_INITIAL_LOADING : LS_LOADING }));
      fetchData();
      return () => controller.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentDate]);

   const handleMoveCurrDate = (advance) => {
      const newDate = new Date(currentDate.getTime());
      newDate.setTime(newDate.getTime() + (1000 * 60 * 60 * 24 * (advance ? 1 : -1)));
      setSearchParams({ date: utils.getDateToURLParam(newDate) })
   };

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
                                 <header >
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
                                    <section className="day-task-top margin-2-b">
                                       <DailyScoreView currDay={selPeriod.day} />
                                       <div className="col-05 align-start">
                                          <ButtonAction
                                             caption={`${showDrafts ? 'Fechar ' : ''} Rascunhos`}
                                             primary={false}
                                             onClick={() => setShowDrafts(p => !p)}
                                          />
                                          {showDrafts && <DraftList />}
                                       </div>

                                    </section>

                                 </header>
                                 {
                                    screenState.state === LS_LOADED ?
                                       (
                                          <ul>
                                             <InputNewItem currDay={selPeriod.day} />
                                             {
                                                exprItems.length > 0 ?
                                                   exprItems.map((itm) => <ExpressionItem
                                                      item={itm}
                                                      key={itm.id}
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
                                 <DailyScoreView currDay={selPeriod.day} />
                                 <DraftList />
                              </aside>
                           </>
                        )
                  )
            }
         </div>
      </ParentContent>
   )
}


const DayTask = () => {
   return (
      <DayTaskProvider>
         <InnerDayTask />
      </DayTaskProvider>
   )
}

export default DayTask;
