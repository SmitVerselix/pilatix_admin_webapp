import { request, requestWithMessage } from '../api/client';
import endpoints from '../api/endpoints';
import storage from '../api/storage';
import type { AuthPayload, LoginRequest, RegisterRequest, User } from '../api/types';

export const authService = {
    /** POST /admin/auth/login - deviceType is required by the Joi schema. */
    login: (email: string, password: string) => {
        const body: LoginRequest = {
            email,
            password,
            deviceType: 'web',
            deviceId: storage.getDeviceId(),
            deviceName: navigator.userAgent.slice(0, 120),
        };
        return request<AuthPayload>({ url: endpoints.auth.login, method: 'POST', data: body });
    },

    /** POST /admin/auth/logout - the backend only records history when a deviceId comes back. */
    logout: () =>
        request<unknown>({
            url: endpoints.auth.logout,
            method: 'POST',
            data: { deviceId: storage.getDeviceId() },
        }),

    /** POST /admin/auth/register - used by the "Add user" screen. roleId is required. */
    register: (body: RegisterRequest) =>
        requestWithMessage<AuthPayload>({
            url: endpoints.auth.register,
            method: 'POST',
            data: { deviceType: 'web', ...body },
        }),

    /** GET /web/user/profile/profile */
    getProfile: () => request<User>({ url: endpoints.profile.get, method: 'GET' }),

    /** PUT /web/user/profile/profile - accepts name and/or email, at least one. */
    updateProfile: (body: { name?: string; email?: string }) =>
        requestWithMessage<unknown>({ url: endpoints.profile.update, method: 'PUT', data: body }),
};

export default authService;
