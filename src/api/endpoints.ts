/**
 * Every backend path used by this panel, in one place.
 *
 * Paths are absolute from the API origin and carry their own version segment,
 * so `VITE_API_BASE_URL` is just scheme://host:port.
 *
 * Route tree on the backend (src/api/v1/routes):
 *   /api/v1/admin     -> auth, role, upload, login-history, dashboard
 *   /api/v1/app/user  -> auth, profile, role, upload, login-history
 *   /api/v1/web/user  -> auth, profile, role, upload, login-history
 *
 * The admin group does not mount `user.routes.ts`, so the profile read/update
 * endpoints are only reachable through the `web` group. Note the doubled
 * segment: web/index.ts mounts userRoute at `/profile` and userRoute itself
 * declares `/profile`, hence `/web/user/profile/profile`.
 */

/**
 * API version prefixes. These live here rather than in VITE_API_BASE_URL so a
 * second version can be introduced alongside the first - add `const V2 =
 * '/api/v2'` and point only the endpoints that moved at it.
 */
const V1 = '/api/v1';

const ADMIN = `${V1}/admin`;
const WEB = `${V1}/web/user`;

export const endpoints = {
    auth: {
        login: `${ADMIN}/auth/login`,
        logout: `${ADMIN}/auth/logout`,
        register: `${ADMIN}/auth/register`,
        socialLogin: `${ADMIN}/auth/social-login`,
        guestLogin: `${ADMIN}/auth/guest-login`,
    },
    role: {
        list: `${ADMIN}/role`,
        create: `${ADMIN}/role`,
        update: (id: string) => `${ADMIN}/role/${id}`,
        remove: (id: string) => `${ADMIN}/role/${id}`,
    },
    user: {
        /**
         * POST, not GET - the filters travel in the body (see UserListQuery).
         * Admin-only; the auth middleware also lets `superadmin` through.
         */
        list: `${ADMIN}/dashboard/list-users`,
        /** POST { userId } - includes the role and every registered device. */
        byId: `${ADMIN}/dashboard/get-user-by-id`,
        /** POST { userId, page, limit, sortBy, sortOrder, search } */
        loginHistory: `${ADMIN}/dashboard/get-login-history-by-user-id`,
    },
    loginHistory: {
        list: `${ADMIN}/login-history`,
    },
    upload: {
        single: `${ADMIN}/upload/upload-single`,
    },
    profile: {
        get: `${WEB}/profile/profile`,
        update: `${WEB}/profile/profile`,
    },
} as const;

export default endpoints;
