import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import keycloak from './keycloak';
import KeycloakType from 'keycloak-js';
import Lottie from "lottie-react";
import loadingAnimation from './../../public/Material loading.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

interface KeycloakContextType {
    keycloak: KeycloakType;
    authenticated: boolean;
    initialized: boolean;
    userInfo?: any;
}

const KeycloakContext = createContext<KeycloakContextType>({
    keycloak,
    authenticated: false,
    initialized: false,
});

export const useKeycloak = () => useContext(KeycloakContext);

interface KeycloakProviderProps {
    children: ReactNode;
}

let initializedOnce = false;

export const KeycloakProvider: React.FC<KeycloakProviderProps> = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(
        () => localStorage.getItem('kc-authenticated') === 'true'
    );
    const [initialized, setInitialized] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    const syncUser = async () => {
        if (!keycloak.tokenParsed) return;

        const userData = {
            keycloakId: keycloak.tokenParsed.sub,
            username: keycloak.tokenParsed.preferred_username,
            firstName: keycloak.tokenParsed.given_name || '',
            lastName: keycloak.tokenParsed.family_name || '',
            email: keycloak.tokenParsed.email || '',
            role: 'USER',
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/users/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${keycloak.token}`,
                },
                body: JSON.stringify(userData),
            });

            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
        } catch (err) {
            console.error('User sync failed:', err);
        }
    };

    useEffect(() => {
        if (initializedOnce) {
            setAuthenticated(keycloak.authenticated ?? false);
            setInitialized(true);
            setUserInfo(keycloak.tokenParsed || null);
            return;
        }

        keycloak
            .init({
                onLoad: 'check-sso',
                silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                pkceMethod: 'S256',
                checkLoginIframe: false,
            })
            .then(async (auth) => {
                setAuthenticated(auth);
                setInitialized(true);
                localStorage.setItem('kc-authenticated', auth ? 'true' : 'false');
                initializedOnce = true;

                if (auth) {
                    setUserInfo(keycloak.tokenParsed || null);
                    await syncUser();

                    keycloak.onTokenExpired = () => {
                        keycloak
                            .updateToken(30)
                            .then((refreshed) => {
                                if (refreshed) {
                                    setUserInfo(keycloak.tokenParsed || null);
                                }
                            })
                            .catch(() => {
                                console.warn('Token refresh failed, logging out');
                                keycloak.logout();
                            });
                    };
                }
            })
            .catch((err) => {
                console.error('Keycloak init failed', err);
                setAuthenticated(false);
                setInitialized(true);
                localStorage.setItem('kc-authenticated', 'false');
                initializedOnce = true;
            });
    }, []);

    if (!initialized) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9f9f9' }}>
                <Lottie animationData={loadingAnimation} loop style={{ width: 200, height: 200 }} />
            </div>
        );
    }

    return (
        <KeycloakContext.Provider value={{ keycloak, authenticated, initialized, userInfo }}>
            {children}
        </KeycloakContext.Provider>
    );
};
