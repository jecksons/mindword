import ParentContent from "../../components/parent-content";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import './styles.css';
import api from "../../services/api";
import SurfaceLoading from "../../components/surface-loading";
import utils from "../../services/utils";
import NotFoundSurface from "../../components/not-found-surface";
import { ImCross } from 'react-icons/im';
import { ErrorToast } from "../../components/toast";

const ShowByItems = [
   {
      caption: 'Letra inicial',
      expression: 'initial'
   },
   {
      caption: 'Data de cadastro',
      expression: 'catalog_date'
   }
]


function VocabularyItem({ item, showBy }) {


   const [detailData, setDetailData] = useState({
      state: LS_INITIAL_LOADING,
      show: false,
      data: null
   });

   const onClickShow = useCallback(() => setDetailData(p => ({ ...p, show: !p.show })),
      [setDetailData]);

   useEffect(() => {
      if (detailData.state === LS_INITIAL_LOADING && detailData.show) {
         const ab = new AbortController();
         const fetchData = async () => {
            try {
               const ret = await api.get(`/expressions/id/${item.id}`, { signal: ab.signal });
               const newDetData = { ...ret.data };
               /* It was coming a row return at the end of the phrase.*/
               while (newDetData.example_phrase.length > 0 &&
                  newDetData.example_phrase.lastIndexOf('\n') === (newDetData.example_phrase.length - 1)) {
                  newDetData.example_phrase = newDetData.example_phrase.substr(0, newDetData.example_phrase.length - 2);
               }
               setDetailData(p => ({ ...p, state: LS_LOADED, data: newDetData }));
            }
            catch (err) {
               if (!api.isCancel(err)) {
                  ErrorToast.fire(
                     {
                        title: 'Erro ao salvar anotações',
                        text: utils.getHTTPError(err),
                        icon: 'error'
                     }
                  );
                  setDetailData(p => ({ ...p, show: false }));
               }
            }
         }
         fetchData();
         return () => ab.abort();
      }
   }, [item.id, detailData.show, detailData.state]);

   return (
      <li>
         <div className="col align-start">
            {item.begin_section &&
               <h3 className="font-2 color-black-3 margin-1-b margin-105-t">{showBy.expression === 'catalog_date' ? utils.getDateToStrShow(new Date(item.begin_section), false, true) : item.begin_section}</h3>
            }
            <div className="row just-start margin-05-b">
               <button className="btn btn-link text-left font-bold font-1012 color-black-2 margin-1-r min-width-8" onClick={onClickShow} >{item.description}</button>
               <label className="color-black-2">{item.meaning}</label>
            </div>
         </div>
         {detailData.show &&
            (
               <div className="col detail-vocabulary">
                  {
                     detailData.state === LS_INITIAL_LOADING ?
                        <SurfaceLoading size={16} /> :
                        (
                           detailData.data &&
                           (
                              <>
                                 {detailData.data.synonyms &&
                                    (
                                       <div className="row-1 width-100 align-start">
                                          <div className="col align-start">
                                             {detailData.data.synonyms &&
                                                <>
                                                   <label className="color-grey font-75 margin-05-b">Sinônimos</label>
                                                   <label className="color-black-2 font-87 margin-1-b">{detailData.data.synonyms}</label>
                                                </>
                                             }
                                          </div>
                                          <div className="row align-start">
                                             <label className="color-grey font-75 margin-05-r">{utils.getDateToStrShow(detailData.data.catalog_date, false, true)}</label>
                                             <button className="btn-icon btn-color-prim pad-0" onClick={onClickShow}>
                                                <ImCross size={16} />
                                             </button>
                                          </div>
                                       </div>
                                    )
                                 }
                                 <div className="row align-start width-100  ">
                                    <div className="col align-start width-100 ">
                                       <label className="color-grey font-75">Exemplos:</label>
                                       <ul className="col align-start vocabulary-example color-black-2">
                                          {
                                             detailData.data.example_phrase.split('\n').map((itm, idx) => <li key={idx}  >{itm}</li>)
                                          }
                                       </ul>
                                    </div>
                                    <div className="col align-end " >
                                       {!detailData.data.synonyms &&
                                          (
                                             <div className="row align-start margin-1-b flex-1">
                                                <label className="color-grey font-75 white-nowrap margin-05-r">{utils.getDateToStrShow(detailData.data.catalog_date, false, true)}</label>
                                                <button className="btn-icon btn-color-prim pad-0" onClick={onClickShow}>
                                                   <ImCross size={16} />
                                                </button>
                                             </div>
                                          )
                                       }
                                       <button className="btn-link">
                                          Editar
                                       </button>
                                    </div>

                                 </div>
                              </>
                           )
                        )
                  }


               </div>
            )
         }
      </li>
   )
}

const LS_INITIAL_LOADING = 0;
const LS_LOADED = 1;
const LS_ERROR = 2;
const LS_LOADING = 3;

export default function Vocabulary(props) {

   const [showBy, setShowBy] = useState(ShowByItems[0]);
   const [searchResults, setSearchResults] = useState(null);
   const [loadState, setLoadState] = useState({ state: LS_INITIAL_LOADING, errorMessage: '' });
   const [inputSearch, setInputSearch] = useState('');
   const [textSearch, setTextSearch] = useState('');

   const fetchVocabulary = useCallback(async (offset = 0) => {
      setLoadState(p => ({ state: ((p.state === LS_INITIAL_LOADING) || (p.state === LS_ERROR)) ? LS_INITIAL_LOADING : LS_LOADING, errorMessage: '' }));
      try {
         let searchUri = `/expressions/vocabulary/?offset=${offset}&limit=50&showby=${showBy.expression}`;
         if (textSearch !== '') {
            searchUri += `&searchtext=${textSearch}`;
         }
         const ret = await api.get(searchUri);
         setSearchResults(p => offset > 0 ?
            ({
               metadata: { ...p.metadata, count: p.count + ret.metadata.count },
               results: [...p.results, [...ret.data.results]]
            }) :
            ret.data
         );
         setLoadState({ state: LS_LOADED, errorMessage: '' });
      } catch (err) {
         if (!api.isCancel(err)) {
            console.log(err);
         } else {
            setLoadState({ state: LS_ERROR, errorMessage: utils.getHTTPError(err) });
         }
      }
   }, [showBy.expression, setSearchResults, setLoadState, textSearch]);

   useEffect(() => {
      const timOt = setTimeout(() => {
         setTextSearch(inputSearch)
      }, 500);
      return () => clearTimeout(timOt);
   }, [inputSearch, setTextSearch]);


   useEffect(() => {
      const cancelToken = api.getCancelToken();
      fetchVocabulary();
      return () => cancelToken.cancel();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [showBy, textSearch]);


   return (
      <ParentContent solidHeaderBack={true}>
         {
            loadState.state === LS_INITIAL_LOADING ?
               <SurfaceLoading /> :
               (
                  loadState.state === LS_ERROR ?
                     <NotFoundSurface title="Não foi possível buscar os dados" message={loadState.errorMessage} /> :
                     (
                        <div className="vocabulary-parent">
                           <header className="vocabulary-top">
                              <div className="row-1">
                                 <input placeholder="Pesquisa"
                                    className="width-100 margin-1-r"
                                    value={inputSearch}
                                    autoFocus={true}
                                    onChange={(e) => setInputSearch(e.target.value)}
                                 />
                                 {searchResults && <label className="font-1 color-grey white-nowrap">{searchResults.metadata.total} expressões</label>}
                              </div>
                              <nav className="row just-start">
                                 {ShowByItems.map((itm, idx) => <button key={idx}
                                    className={`btn btn-header-tab ${itm.expression === showBy.expression ? 'selected' : ''}`}
                                    onClick={() => setShowBy(itm)}
                                 >{itm.caption}</button>)}
                              </nav>
                           </header>
                           {loadState.state === LS_LOADED ?
                              (
                                 searchResults?.results &&
                                 <ul className="vocabulary-items">
                                    {searchResults.results.map((itm) => <VocabularyItem showBy={showBy} item={itm} key={itm.id} />)}
                                 </ul>
                              ) :
                              (
                                 <ul className="vocabulary-items">
                                    <SurfaceLoading />
                                 </ul>
                              )
                           }
                        </div>
                     )
               )
         }

      </ParentContent>
   )
}