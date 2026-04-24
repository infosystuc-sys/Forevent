import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useStorageState } from '~/hooks/useStorageState';
import { sharedQueryClient, setAuthToken } from '~/utils/api';

const USER_STORAGE_KEY = 'user';

export type ActiveRole = 'USER' | 'EMPLOYEE';

interface SignInPayload {
    user: AuthenticatedUser
    sessionId: string;
}

interface AuthenticatedUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    locale: string | null;
    zoneinfo: string | null;
    about: string | null;
}

interface Session {
    signIn: (props: SignInPayload) => void;
    signOut: () => Promise<void>;
    session?: string | null;
    isLoading: boolean;
    user: AuthenticatedUser | null;
    activeRole: ActiveRole;
    setActiveRole: (role: ActiveRole) => void;
}

const AuthContext = React.createContext<Session>({
    signIn: () => null,
    signOut: async () => undefined,
    isLoading: false,
    user: null,
    session: null,
    activeRole: 'USER',
    setActiveRole: () => null,
});

// This hook can be used to access the user info.
export function useSession() {
    const value = React.useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }

    return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
    const [[isSessionLoading, session], setSession] = useStorageState('session');
    const [user, setUser] = useState<AuthenticatedUser | null>(null)
    const [isUserLoading, setIsUserLoading] = useState(true)
    const [activeRole, setActiveRole] = useState<ActiveRole>('USER')

    // Hidratar user desde SecureStore en cold start. Evita tener que pasar por validateSession cada vez.
    useEffect(() => {
        let cancelled = false;
        SecureStore.getItemAsync(USER_STORAGE_KEY)
            .then((raw) => {
                if (cancelled) return
                if (raw) {
                    try {
                        setUser(JSON.parse(raw) as AuthenticatedUser)
                    } catch {
                        // JSON corrupto → borrar y seguir como logged-out
                        void SecureStore.deleteItemAsync(USER_STORAGE_KEY)
                    }
                }
                setIsUserLoading(false)
            })
            .catch(() => {
                if (!cancelled) setIsUserLoading(false)
            });
        return () => { cancelled = true };
    }, [])

    // Propagar el token al cliente tRPC cada vez que cambia la sesión.
    useEffect(() => {
        setAuthToken(session ?? null)
    }, [session])

    const isLoading = isSessionLoading || isUserLoading;

    return (
        <AuthContext.Provider value={{
            signIn: (payload) => {
                setUser(payload.user)
                setSession(payload.sessionId);
                // Persistir user también para cold-start (evita round-trip a validateSession).
                void SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(payload.user))
            },
            signOut: async () => {
                setUser(null);
                setSession(null);
                setActiveRole('USER');
                setAuthToken(null);
                await SecureStore.deleteItemAsync(USER_STORAGE_KEY).catch(() => undefined);
                sharedQueryClient?.clear();
            },
            session,
            user,
            isLoading,
            activeRole,
            setActiveRole,
        }}>
            {props.children}
        </AuthContext.Provider>
    );
}
