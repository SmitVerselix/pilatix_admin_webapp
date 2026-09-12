import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { setSessionExpiredHandler } from '../api/client';
import storage, { sanitiseUser } from '../api/storage';
import type { User } from '../api/types';
import authService from '../services/auth.service';

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    /** True until the stored session has been checked against the backend. */
    initialising: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<User | null>;
    setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(() => storage.getToken());
    const [user, setUserState] = useState<User | null>(() => storage.getUser<User>());
    const [initialising, setInitialising] = useState<boolean>(() => Boolean(storage.getToken()));

    const setUser = useCallback((next: User) => {
        const safe = sanitiseUser(next as unknown as Record<string, unknown>) as unknown as User;
        setUserState(safe);
        storage.setUser(safe as unknown as Record<string, unknown>);
    }, []);

    const clear = useCallback(() => {
        storage.clearSession();
        setToken(null);
        setUserState(null);
    }, []);

    // The axios interceptor cannot touch React state directly, so it calls back here.
    useEffect(() => {
        setSessionExpiredHandler(clear);
    }, [clear]);

    const refreshProfile = useCallback(async () => {
        if (!storage.getToken()) return null;
        try {
            const fresh = await authService.getProfile();
            setUser(fresh);
            return fresh;
        } catch {
            // A dead token is already cleared by the interceptor; anything else
            // (e.g. the profile route being unavailable) keeps the cached user.
            return null;
        }
    }, [setUser]);

    // Validate the persisted token once on boot.
    useEffect(() => {
        if (!storage.getToken()) {
            setInitialising(false);
            return;
        }
        refreshProfile().finally(() => setInitialising(false));
    }, [refreshProfile]);

    const login = useCallback(
        async (email: string, password: string) => {
            const payload = await authService.login(email, password);
            storage.setToken(payload.token);
            setToken(payload.token);
            setUser(payload.user);

            // The login response has no `role` include; the profile read does.
            const enriched = await refreshProfile();
            return enriched ?? payload.user;
        },
        [setUser, refreshProfile],
    );

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // Log the user out locally even if the backend call fails.
        }
        clear();
    }, [clear]);

    const value = useMemo<AuthState>(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token),
            initialising,
            login,
            logout,
            refreshProfile,
            setUser,
        }),
        [user, token, initialising, login, logout, refreshProfile, setUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
