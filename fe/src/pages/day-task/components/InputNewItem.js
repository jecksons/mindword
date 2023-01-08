import { useCallback, useRef, useState } from "react";
import api from '../../../services/api';
import utils from "../../../services/utils";
import ButtonAction from "../../../components/button-action";
import { ErrorToast } from '../../../components/toast';

export function InputNewItem({ onItemAdded, currDay }) {

   const [exprText, setExprText] = useState('');
   const [posting, setPosting] = useState(false);
   const refInput = useRef(null);

   const handleAddItem = useCallback(() => {
      if (exprText !== '') {
         setPosting(true);
         api.post('/expressions', { description: exprText, catalog_date: currDay })
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
