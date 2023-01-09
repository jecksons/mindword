import React, { useReducer, useState } from 'react';
import { useContext } from 'react';
import { ErrorToast } from '../components/toast';
import api from '../services/api';
import utils from '../services/utils';


export const DayTaskContext = React.createContext();

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


export const DayTaskProvider = ({ children }) => {

   const [exprItems, dispatchExprItems] = useReducer(reducerExprItems, []);
   const [dailyScore, setDailyScore] = useState({ items: 0, valid_items: 0, goal: 0 });


   const [drafts, dispatchDrafts] = useReducer(reducerExprItems, []);
   const [selPeriod, setSelPeriod] = useState({ prior: false, others: false, day: new Date(), dayString: 'Terça-feira, xx de xxxx de xxxx' });

   const fetchDay = async (currentDate, abortSignal) => {
      try {
         const ret = await api.get(`/expressions/day-task/${utils.getDateToURLParam(currentDate)}`, {
            signal: abortSignal
         });
         setDailyScore(ret.data.score);
         ret.data.items.reverse();
         dispatchExprItems({ type: 'set', values: ret.data.items });
         dispatchDrafts({ type: 'set', values: ret.data.drafts });
         const selDate = new Date(ret.data.period.day);
         setSelPeriod({ ...ret.data.period, day: selDate, dayString: utils.getDateToStrShow(selDate, false, true) });
      } catch (err) {
         if (!api.isCancel(err)) {
            throw err;
         }
      }
   }


   const addExpression = async (text, currDay) => {
      if (text !== '') {
         try {
            const ret = await api.post('/expressions', { description: text, catalog_date: currDay });
            handleItemAdded(ret.data);
            return true;
         } catch (err) {
            ErrorToast.fire(
               {
                  title: 'Erro ao adicionar expressão',
                  text: utils.getHTTPError(err),
                  icon: 'error'
               }
            );
         }
      }
      return false;
   };

   const addDraft = async (text, translatedText) => {
      if (text !== '') {
         try {
            const ret = await api.post('/drafts', { description: text, translation_meaning: translatedText });
            dispatchDrafts({ type: 'append', value: ret.data });
            return true;
         } catch (err) {
            ErrorToast.fire(
               {
                  title: 'Erro ao adicionar rascunho',
                  text: utils.getHTTPError(err),
                  icon: 'error'
               }
            );
         }
      }
      return false;
   }


   const addExpressionFromDraft = async (draftId) => {
      if (draftId) {
         try {
            const ret = await api.post('/expressions/from-draft', { id_draft: draftId });
            dispatchDrafts({ type: 'del', value: { id: draftId } });
            handleItemAdded(ret.data);
            return true;
         } catch (err) {
            ErrorToast.fire(
               {
                  title: 'Erro ao adicionar expressão',
                  text: utils.getHTTPError(err),
                  icon: 'error'
               }
            );
         }
      }
      return false;
   }

   const deleteDraft = async (draftId) => {
      if (draftId) {
         try {
            await api.delete(`/drafts/${draftId}`);
            dispatchDrafts({ type: 'del', value: { id: draftId } });
            return true;
         } catch (err) {
            ErrorToast.fire(
               {
                  title: 'Erro ao remover expressão',
                  text: utils.getHTTPError(err),
                  icon: 'error'
               }
            );
         }
      }
      return false;
   }


   const handleItemAdded = ({ data, score }) => {
      dispatchExprItems({ type: 'append', value: data });
      setDailyScore(score);
   };

   const onItemChanged = ({ data, score }) => {
      dispatchExprItems({ type: 'update', value: data });
      setDailyScore(score);
   };

   const onItemDeleted = ({ data, score }) => {
      dispatchExprItems({ type: 'del', value: data });
      setDailyScore(score);
   };

   return (
      <DayTaskContext.Provider value={{
         addExpression,
         exprItems,
         fetchDay,
         onItemChanged,
         onItemDeleted,
         dailyScore,
         setDailyScore,
         selPeriod,
         addDraft,
         drafts,
         addExpressionFromDraft,
         deleteDraft
      }}>
         {children}
      </DayTaskContext.Provider>
   )
}


export const useDayTask = () => {

   const value = useContext(DayTaskContext);
   if (!value) {
      throw new Error('Please wrap the component within a DayTaskProvider');
   }

   return value;
};
