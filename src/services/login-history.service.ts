import { request } from '../api/client';
import endpoints from '../api/endpoints';
import type { LoginHistoryEntry, Paginated } from '../api/types';

export const loginHistoryService = {
    /**
     * GET /admin/login-history - scoped to the authenticated user by
     * LoginHistoryService.listLoginHistory (it reads req.user.id).
     */
    list: (page = 1, limit = 10) =>
        request<Paginated<LoginHistoryEntry>>({
            url: endpoints.loginHistory.list,
            method: 'GET',
            params: { page, limit },
        }),
};

export default loginHistoryService;
