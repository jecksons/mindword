import ButtonAction from "../../../components/button-action";
import { useDayTask } from "../../../store/day-task-context"
import deleteIcon from "../../../media/delete.webp";
import { useState } from "react";


const DraftItem = ({ item }) => {

   const [adding, setAdding] = useState(false);

   const { addExpressionFromDraft, deleteDraft } = useDayTask();

   const addToExpressions = async () => {
      setAdding(true);
      if (!await addExpressionFromDraft(item.id)) {
         setAdding(false);
      }
   }

   return (
      <li key={item.id} className="row-05" >
         <div className="col align-start">
            <label className="draft-title">{item.description}</label>
            <label className="draft-meaning">{item.translation_meaning}</label>
         </div>
         <div className="row-05">
            <ButtonAction
               caption="Adic."
               primary={false}
               processing={adding}
               onClick={addToExpressions}
               className="btn-add-draft"
            />
            <button className="btn-link" onClick={() => deleteDraft(item.id)} ><img src={deleteIcon} alt="delete draft" /></button>
         </div>
      </li>
   );
}

export const DraftList = () => {

   const { drafts } = useDayTask();

   return (
      <section className="draft-list">
         <h3>Rascunhos</h3>
         <ol>

            {
               drafts.length ? drafts.map(itm => <DraftItem key={itm.id} item={itm} />) : <div className="no-items"><label>Sem rascunhos adicionados</label></div>
            }
         </ol>
      </section>
   );
}