import { useCallback, useState } from "react";
import Modal from 'react-modal';
import api from '../../../services/api';
import utils from "../../../services/utils";
import ButtonAction from "../../../components/button-action";
import { ErrorToast } from '../../../components/toast';


export function ChangeGoalModal({ currGoal, onSaved, onRequestClose, position, currDay }) {

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