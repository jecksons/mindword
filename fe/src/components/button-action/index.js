import PropTypes from 'prop-types';
import SurfaceLoading from '../surface-loading';

function ButtonAction(props) {

   const processing = props.processing ?? false;
   const btnStyle = {minWidth: props.minWidth ?? 0};
   if (!btnStyle.minWidth) {
      delete btnStyle.minWidth;
   } 
   if (processing) {
       btnStyle.pointerEvents = 'none';
   }
   return <button  
      style={btnStyle}
      className={`${props.primary ? 'btn-action-primary' : 'btn-action-secundary'} ${props.fullSize ? 'width-100' : ''}  ${processing ? 'btn-pad-05-105' : ''}  ${props.disabled ? 'btn-disabled' : ''}`} 
      onClick={processing || props.disabled ? null: props.onClick}>
      {
         processing ? 
            <SurfaceLoading height={36} width={36} onBackground={props.primary} loadType="bars" /> : 
            props.caption}
 </button>
}

ButtonAction.defaultProps = {
   fullSize: false,
   primary: true
}

ButtonAction.propTypes = {
   processing: PropTypes.bool,
   caption: PropTypes.string,
   onClick: PropTypes.func,
   disabled: PropTypes.bool,
   minWidth: PropTypes.number,
   fullSize: PropTypes.bool,
   primary: PropTypes.bool
}

export default ButtonAction;