import { useRef, useState } from "react";
import api from '../../../services/api';
import utils from "../../../services/utils";
import ButtonAction from "../../../components/button-action";
import { ErrorToast } from '../../../components/toast';
import { useDebounce } from 'react-use';
import { useEffect } from "react";
import logoTranslate from '../../../media/google-translate-color.webp';
import { useDayTask } from "../../../store/day-task-context";

export function InputNewItem({ currDay }) {

   const [exprText, setExprText] = useState('');
   const [posting, setPosting] = useState(false);
   const [postingDraft, setPostingDraft] = useState(false);
   const refInput = useRef(null);
   const [debouncedText, setDebouncedText] = useState('');
   const [translatedText, setTranslatedText] = useState([]);
   const { addExpression, addDraft } = useDayTask();



   const handleAddItem = async () => {
      if (exprText !== '') {
         setPosting(true);
         if (await (addExpression(exprText, currDay))) {
            setExprText('');
            refInput.current.focus();
         }
         setPosting(false);
      }
   };


   const handleAddDraft = async () => {
      if (exprText !== '') {
         setPostingDraft(true);
         if (await addDraft(exprText, translatedText.join(';'))) {
            setExprText('');
            refInput.current.focus();
         }
         setPostingDraft(false);
      }
   };

   const [,] = useDebounce(() => setDebouncedText(exprText), 500, [exprText]);

   useEffect(() => {
      if (!debouncedText || !exprText) {
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
            if (!api.isCancel(err)) {
               ErrorToast.fire(
                  {
                     title: 'Erro ao carregar tradução',
                     text: utils.getHTTPError(err),
                     icon: 'error'
                  }
               );
            }
         }
      }
      functGet();
      return () => controller.abort();
   }, [debouncedText, exprText, setTranslatedText])

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
            processing={postingDraft}
            onClick={handleAddDraft}
            caption="Adicionar aos rascunhos" />
         {!!translatedText.length &&
            <div className="col-1 width-100 google-translation-tip border-box  " >
               <div className="width-100 row-05 just-start" >
                  <img src={logoTranslate} alt="google translate" />
                  <label>Google translation</label>
               </div>
               {translatedText.map((itm, idx) => <p key={idx}>{itm}</p>)}
            </div>
         }
      </div>
   )
}
