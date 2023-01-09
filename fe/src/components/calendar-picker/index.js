import Modal from 'react-modal';
import Calendar from 'react-calendar';


export default function CalendarPicker({ defaultValue, onChange, onRequestClose, position }) {

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
            <Calendar onChange={onChange} defaultValue={defaultValue} />
         </section>
      </Modal>
   )
}
