import { useCallback, useEffect, useRef, useState } from "react";
import api from '../../../services/api';
import utils from "../../../services/utils";
import ButtonAction from "../../../components/button-action";
import { ErrorToast } from '../../../components/toast';
import { useLocalStorage } from "../../../hooks/utils-hooks";

export function UserAnnotation({ defaultValue, onAddFromAnnotation }) {

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
            <button className="btn-link margin-1-b" onClick={() => handleChange({ target: { value: '' } })}>Limpar</button>
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
