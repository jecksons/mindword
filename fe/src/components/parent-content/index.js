import AppHeader from "../app-header";
import './styles.css';
import PropTypes from 'prop-types';

export default function ParentContent(props) {

    return (
        <div className="parent-content">
            <AppHeader  solidBack={props.solidHeaderBack} />
            {props.children}            
        </div>
    )
}


ParentContent.propTypes = {
    solidHeaderBack: PropTypes.bool
}
