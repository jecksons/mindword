import './css/settings.css';
import './css/objects.css';
import './css/components.css';
import React, { useState, useMemo, useCallback } from "react";
import ScrollToTop from './components/scroll-to-top';
import DayTask from './pages/day-task';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLocalStorage } from './hooks/utils-hooks';
import UserContext from './store/user-context';
import ErrorBoundary from './components/error-boundary';
import Vocabulary from './pages/vocabulary';
import AuthModal from './pages/auth-modal';


function App() {

    const [localUser, setLocalUser, reloadLocalUser] = useLocalStorage('user', null);
    const [userInfo, setUserInfo] = useState(localUser);
    const updaterUserInfo = useCallback((newValue) => {
        setLocalUser(newValue);
        setUserInfo(newValue);
    }, [setLocalUser, setUserInfo]);
    const reloadUserInfo = useCallback(() => {
        const refreshUser = reloadLocalUser();
        setUserInfo(refreshUser);
    }, [reloadLocalUser]);
    const userValue = useMemo(() => ({ userInfo, setUserInfo: updaterUserInfo, reloadUserInfo }), [userInfo, updaterUserInfo, reloadUserInfo]);
    const [isLogged, setIsLogged] = useState(false);

    return (
        <div className="App">

            <ErrorBoundary>
                <UserContext.Provider value={userValue} >
                    <BrowserRouter>
                        <ScrollToTop>
                            <Routes>
                                {isLogged ?
                                    <>
                                        <Route path="/" element={<DayTask />} />
                                        <Route exact path="/vocabulary" element={<Vocabulary />} />
                                        <Route path="*" element={<DayTask />} />
                                    </> :
                                    <Route path="*" element={<AuthModal showAuth={!isLogged} onAuth={() => setIsLogged(true)} />} />
                                }
                            </Routes>
                        </ScrollToTop>
                    </BrowserRouter>
                </UserContext.Provider>
            </ErrorBoundary>
        </div>
    );
}

export default App;
