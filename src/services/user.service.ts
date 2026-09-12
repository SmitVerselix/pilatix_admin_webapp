import { request } from '../api/client';
import endpoints from '../api/endpoints';
import type {
    CountRows,
    LoginHistoryEntry,
    UserDetail,
    UserListItem,
    UserListQuery,
    UserLoginHistoryQuery,
} from '../api/types';

export const userService = {
    /**
     * POST /admin/dashboard/list-users - the filters go in the body, not the
     * query string. Returns Sequelize's findAndCountAll shape.
     *
     * `search` matches name, email or mobile (case-insensitive). Omitting
     * `isActive` returns both active and disabled accounts; passing an unknown
     * `roleId` is rejected with "Role not found." rather than returning empty.
     */
    list: (query: UserListQuery = {}) =>
        request<CountRows<UserListItem>>({
            url: endpoints.user.list,
            method: 'POST',
            data: query,
        }),

    /**
     * POST /admin/dashboard/get-user-by-id. Answers 400 "User not found." for an
     * id that does not exist, rather than 404 with an empty body.
     */
    getById: (userId: string) =>
        request<UserDetail>({ url: endpoints.user.byId, method: 'POST', data: { userId } }),

    /**
     * POST /admin/dashboard/get-login-history-by-user-id - unlike the
     * self-scoped /admin/login-history, this reads any user's activity.
     * Returns `{ count, rows }`; rows carry no joined user.
     */
    loginHistory: (query: UserLoginHistoryQuery) =>
        request<CountRows<LoginHistoryEntry>>({
            url: endpoints.user.loginHistory,
            method: 'POST',
            data: query,
        }),
};

export default userService;
