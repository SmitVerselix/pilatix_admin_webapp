import { request, requestWithMessage } from '../api/client';
import endpoints from '../api/endpoints';
import type { CountRows, Role, RoleListQuery, RoleRequest } from '../api/types';

export const roleService = {
    /** GET /admin/role - returns Sequelize's findAndCountAll shape. */
    list: (query: RoleListQuery = {}) =>
        request<CountRows<Role>>({ url: endpoints.role.list, method: 'GET', params: query }),

    /** Convenience fetch for role <select> inputs. */
    listAll: async () => {
        const { rows } = await roleService.list({ page: 1, limit: 100 });
        return rows;
    },

    /** POST /admin/role - admin only. `name` must be one of enums.ROLE. */
    create: (body: RoleRequest) =>
        requestWithMessage<Role>({ url: endpoints.role.create, method: 'POST', data: body }),

    /** PUT /admin/role/:id - admin only. */
    update: (id: string, body: Partial<RoleRequest>) =>
        requestWithMessage<unknown>({ url: endpoints.role.update(id), method: 'PUT', data: body }),

    /** DELETE /admin/role/:id - admin only. */
    remove: (id: string) =>
        requestWithMessage<unknown>({ url: endpoints.role.remove(id), method: 'DELETE' }),
};

export default roleService;
