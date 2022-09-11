import React, { useState, useCallback } from "react";
import { useEffect } from 'react';
import config from "../../services/config";
import './styles.css';

export default function AuthModal({ showAuth, onAuth }) {

    const [passText, setPassText] = useState('');

    useEffect(() => {
        if (passText === config.mainPassphrase) {
            setBodyScroll(true);
            onAuth();
        }
    }, [onAuth, passText])

    const setBodyScroll = useCallback((showScroll) => {
        const body = document.querySelector('body');
        body.style.overflow = showScroll ? 'auto' : 'hidden';
    }, []);

    useEffect(() => {
        setBodyScroll(false);

    }, [setBodyScroll])

    return (
        <div className="auth-modal">
            <div >
                <input
                    value={passText}
                    className='main-passphrase'
                    autoFocus
                    onChange={(e) => setPassText(e.target.value)} />
            </div>
        </div>
    )

}