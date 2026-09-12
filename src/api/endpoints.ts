/**
 * Every backend path used by this panel, in one place.
 *
 * Route tree on the backend (src/api/v1/routes):
 *   /api/v1/admin     -> auth, role, upload, login-history
 *   /api/v1/app/user  -> auth, profile, role, upload, login-history
 *   /api/v1/web/user  -> auth, profile, role, upload, login-history
 *
 * The admin group does not mount `user.routes.ts`, so the profile read/update
 * endpoints are only reachable through the `web` group. Note the doubled
 * segment: web/index.ts mounts userRoute at `/profile` and userRoute itself
 * declares `/profile`, hence `/web/user/profile/profile`.
 */

const ADMIN = '/admin';
const WEB = '/web/user';

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
