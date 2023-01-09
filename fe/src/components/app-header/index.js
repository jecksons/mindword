import './styles.css';
import logo from '../../media/mindword-logo.png';
import { useLocation, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const MenuItems = [
   {
      caption: 'Tarefa do dia',
      location: '/'
   },
   {
      caption: 'Vocabulário',
      location: '/vocabulary'
   }
]

export default function AppHeader({ solidBack = false }) {

   const location = useLocation();

   const menuFocus = location.pathname;

   return (
      <header className={`row-1 pad-2 app-header ${solidBack ? '' : 'blur'} `}>
         <div className="row-1 flex-1">
            <img src={logo} alt="logo" />
         </div>
         <div className="row-1 ">
            <nav className="header-menu">
               <ul className="row-2 ">
                  {
                     MenuItems.map((itm, idx) => (
                        <li key={idx} className={`menu-item ${menuFocus === itm.location ? 'selected' : ''}`}>
                           <Link to={itm.location}>{itm.caption}</Link>
                        </li>
                     ))
                  }
               </ul>
            </nav>
         </div>
      </header>
   )
}



AppHeader.propTypes = {
   solidBack: PropTypes.bool
}