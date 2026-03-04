import React, { useState } from 'react';
import { removeStoreData } from '~/lib/storage';
import { useStorageState } from '~/hooks/useStorageState';

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
    signOut: () => void;
    session?: string | null;
    isLoading: boolean,
    user: AuthenticatedUser | null
}

const AuthContext = React.createContext<Session>({
    signIn: () => null,
    signOut: () => null,
    isLoading: false,
    user: null,
    session: null
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
    const [[isLoading, session], setSession] = useStorageState('session');
    const [user, setUser] = useState<AuthenticatedUser | null>(null)

    return (
        <AuthContext.Provider value={{
            signIn: (props) => {
                setUser(props.user)
                setSession(props.sessionId);
            },
            signOut: () => {
                setUser(null);
                setSession(null);
                // Also clear the AsyncStorage keys that index.tsx / login.tsx
                // write so cold-start validation doesn't resurface a stale session.
                void removeStoreData('session');
                void removeStoreData('user');
            },
            session,
            user,
            isLoading,
        }}>
            {props.children}
        </AuthContext.Provider>
    );
}
