import { useCallback, useRef, useState} from "react";
import api from '../../services/api';
import utils from "../../services/utils";
import SurfaceLoading from '../../components/surface-loading';
import {TiTick} from 'react-icons/ti';
import './styles.css';
import { ErrorToast } from '../../components/toast';
import logoGoogle from "../../media/google-translate.webp";
import logoLinguee from "../../media/linguee.webp";
import logoYouglish from "../../media/youglish.webp";
import PropTypes from 'prop-types';


const ActionLinkHelpers = {
    youglish: {
        start: 'https://youglish.com/pronounce/',
        finish: '/english?'
    },
    google: {
        start: 'https://translate.google.com.br/?sl=en&tl=pt&text=',
        finish: '&op=translate'
    },
    linguee: {
        start: 'https://www.linguee.com.br/portugues-ingles/search?source=auto&query=',
        finish: ''
    }
};


function ExpressionItem({item, onItemChanged, onItemDeleted}) {

    const [editItem, setEditItem] = useState({...item});
    const refTimerSave = useRef(null);
    const [deleting, setDeleting] = useState(false);
    const [examplePhrases, setExamplePhrases] = useState(() => {
        const phrases = (item.example_phrase || '').split('\n');
        if (phrases.length === 0 || phrases[phrases.length -1] !== '') {
            phrases.push('');
        }
        return phrases;
    });    

    const handleChange = useCallback((e) => {
        if (e.target.name === 'description' && e.target.value === '') {
            return;
        }
        const newItem = {...editItem, [e.target.name]: e.target.value};
        setEditItem(newItem);
        if (refTimerSave.current) {
            clearTimeout(refTimerSave.current);
            refTimerSave.current = null;            
        }
        refTimerSave.current = setTimeout(() => {
            api.post('/expressions', newItem)
            .then((ret) => {
                onItemChanged(ret.data);
                setEditItem(p => ({...p, valid: ret.data.data.valid}));
            })
            .catch((err) => {
                ErrorToast.fire(
                    {
                        title: 'Erro ao modificar expressão',
                        text: utils.getHTTPError(err),
                        icon: 'error'
                    }
                );
            });
        }, 500);
    }, [setEditItem, refTimerSave, onItemChanged, editItem]);

    const handleDeleteItem = useCallback(() => {
        setDeleting(true);                
        api.delete(`/expressions/id/${editItem.id}`)
        .then((ret) => {
            onItemDeleted({data: {id: editItem.id}, score: ret.data.score});
        })
        .catch((err) => {
            setDeleting(false);                
            ErrorToast.fire(
                {
                    title: 'Erro ao modificar expressão',
                    text: utils.getHTTPError(err),
                    icon: 'error'
                }
            );
        })
    }, [setDeleting, onItemDeleted, editItem.id]);

    const handleChangePhrase = useCallback((e) => {
        const phraseIdx = (parseInt(e.target.name.replace('example_phrase-', '')));
        if (phraseIdx >= 0) {
            let newPhrases = [...examplePhrases];
            if (newPhrases.length > phraseIdx) {
                newPhrases[phraseIdx] = e.target.value;
               if (newPhrases[phraseIdx] === '') {
                   newPhrases.splice(phraseIdx, 1);
               }
            }
            if (newPhrases.length === 0 || newPhrases[newPhrases.length -1] !== '') {
                newPhrases.push('');
            }            
            setExamplePhrases(newPhrases);
            handleChange({target: {name: 'example_phrase', value: newPhrases.join('\n')}})
        }        
    }, [examplePhrases, setExamplePhrases, handleChange]);

    const openActionLink = useCallback((action) => {
        const prov = ActionLinkHelpers[action];
        const win = window.open(`${prov.start}${editItem.description}${prov.finish}`, '_blank');
        win.focus();
    }, [editItem.description]);


    return (
        <li className="expr-item-edit" id={`expr-${item.id}`}>
            <div className={`expr-status ${item.valid ? 'valid' : ''}`}>
                <TiTick  size={16} />
            </div>
            <input 
                value={editItem.description}
                onChange={handleChange}
                name="description"
                className="font-87 font-bold"
                placeholder="Expressão"
                />                        
            <input 
                value={editItem.meaning || ''}
                onChange={handleChange}
                name="meaning"
                placeholder="Significado"
                />            
            <input 
                value={editItem.synonyms || ''}
                onChange={handleChange}
                name="synonyms"
                placeholder="Sinônimos"                
                />
            {examplePhrases.map((el, idx) => (
                <input
                    value={el}
                    onChange={handleChangePhrase}
                    key={idx}
                    name={`example_phrase-${idx}`}
                    placeholder="Frase de exemplo"                
                />                 
            ))}            
            <div className="row-1">
                <div className="row-05">
                    <button className="btn-link btn-lang-help" onClick={() => openActionLink('youglish')}><img  src={logoYouglish} alt="youglish" height={20}/> </button>
                    <button className="btn-link btn-lang-help" onClick={() => openActionLink('linguee')}><img  src={logoLinguee} alt="linguee" height={20}/></button>
                    <button className="btn-link btn-lang-help" onClick={() => openActionLink('google')}><img  src={logoGoogle}  alt="google" height={20}/></button>
                </div>
                <button className={`btn-shadow font-75 min-width-5 ${deleting ? 'pad-025-05' : ''}`} onClick={handleDeleteItem}>
                    {
                        deleting ?                         
                                <SurfaceLoading  loadType="bars" height={21} width={21} /> : 
                                'Remover'                                                
                    }
                </button>                                
            </div>
        </li>
    );
}


ExpressionItem.propTypes = {
    item: PropTypes.object.isRequired,     
    onItemChanged: PropTypes.func.isRequired,
    onItemDeleted: PropTypes.func.isRequired
}

export default ExpressionItem;