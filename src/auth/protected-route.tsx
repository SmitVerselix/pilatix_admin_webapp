import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from '../components/common/loader/loader';
import { useAuth } from './use-auth';

const SIGN_IN = `${import.meta.env.BASE_URL}authentication/sign-in`;

/** Gate for the authenticated shell. */
export function RequireAuth() {
    const { isAuthenticated, initialising } = useAuth();
    const location = useLocation();

    if (initialising) return <Loader />;
    if (!isAuthenticated) return <Navigate to={SIGN_IN} replace state={{ from: location.pathname }} />;

    return <Outlet />;
}

/** Keeps a signed-in admin out of the login screen. */
export function RequireGuest() {
    const { isAuthenticated, initialising } = useAuth();

    if (initialising) return <Loader />;
    if (isAuthenticated) return <Navigate to={`${import.meta.env.BASE_URL}dashboard`} replace />;

    return <Outlet />;
}
