import { useCallback, useRef, useState } from "react";
import api from '../../../services/api';
import utils from "../../../services/utils";
import ButtonAction from "../../../components/button-action";
import { ErrorToast } from '../../../components/toast';
import { useDebounce } from 'react-use';
import { useEffect } from "react";
import logoTranslate from '../../../media/google-translate-color.webp';

export function InputNewItem({ onItemAdded, currDay }) {

   const [exprText, setExprText] = useState('');
   const [posting, setPosting] = useState(false);
   const refInput = useRef(null);
   const [debouncedText, setDebouncedText] = useState('');
   const [translatedText, setTranslatedText] = useState([]);

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

   const [] = useDebounce(() => setDebouncedText(exprText), 500, [exprText]);

   useEffect(() => {
      if (!debouncedText) {
         setTranslatedText([]);
         return;
      }
      const controller = new AbortController();
      const functGet = async () => {
         try {
            const ret = await api.get(`/translate/?text=${encodeURIComponent(debouncedText)}`, {
               signal: controller.signal
            });
            setTranslatedText(ret.data.translatedText);
         } catch (err) {
            ErrorToast.fire(
               {
                  title: 'Erro ao carregar tradução',
                  text: utils.getHTTPError(err),
                  icon: 'error'
               }
            );
         }
      }
      functGet();
      return () => controller.abort();
   }, [debouncedText, setTranslatedText])

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
         <ButtonAction
            fullSize={true}
            primary={false}
            disabled={exprText === ''}
            processing={false}
            onClick={handleAddItem}
            caption="Adicionar aos rascunhos" />
         {!!translatedText.length &&
            <div className="col-1 width-100 google-translation-tip border-box  " >
               <div className="width-100 row-05 just-start" >
                  <img src={logoTranslate} />
                  <label>Google translation</label>
               </div>
               {translatedText.map((itm, idx) => <p key={idx}>{itm}</p>)}
            </div>
         }
      </div>
   )
}
