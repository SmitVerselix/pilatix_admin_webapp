import { useContext } from 'react';
import AuthContext from './auth-context';

/**
 * Access the current session. Lives in its own module so `auth-context.tsx`
 * only exports a component and stays fast-refresh friendly.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
    return context;
}

export default useAuth;
