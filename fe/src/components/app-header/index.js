import './styles.css';
import logo from '../../media/mindword-logo.png';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const MenuItems = [
    {
        caption: 'Tarefa do dia',
        location: '/'
    },
    {
        caption: 'Vocabulário',
        location: '/vocabulary'
    },
    {
        caption: 'Verbos irregulares',
        location: '/irregular-verbs'
    },
    {
        caption: 'Desempenho',
        location: '/performance'
    },
]

export default function AppHeader({solidBack = false}) {

    const location = useLocation();
    const [menuFocus, setMenuFocus] = useState(() => location.pathname);

    return (
        <header className={`row-1 pad-2 app-header ${solidBack ? '' : 'blur'} `}>
            <div className="row-1 flex-1">
                <img src={logo} />                
            </div>
            <div className="row-1 align-start flex-1">
                <nav >
                    <ul className="row-2 ">
                        {
                            MenuItems.map((itm, idx) => (
                                <li key={idx} className={`menu-item ${menuFocus === itm.location ? 'selected' : ''}`}> 
                                    <a  href={itm.location}>{itm.caption}</a>
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