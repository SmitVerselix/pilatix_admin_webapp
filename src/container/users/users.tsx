import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Pageheader from '../../components/common/page-header/pageheader';
import Spktables from '../../@spk/tables/spk-tables';
import SpkBadge from '../../@spk/uielements/spk-badge';
import SpkButton from '../../@spk/uielements/spk-button';
import Pagination from '../../components/common/table/pagination';
import TableState from '../../components/common/table/table-state';
import Select from '../../components/common/form/select';
import { ApiError } from '../../api/client';
import type { Role, UserListItem, UserListQuery } from '../../api/types';
import roleService from '../../services/role.service';
import userService from '../../services/user.service';
import { formatDateTime, humanise, initials } from '../../utils/format';

const BASE = import.meta.env.BASE_URL;

/**
 * Accent per role name, written as literal class strings - Tailwind purges
 * anything assembled as `bg-${name}`.
 */
const ROLE_ACCENTS: Record<string, string> = {
    superadmin: 'bg-primary/10 text-primary',
    admin: 'bg-primary/10 text-primary',
    user: 'bg-success/10 text-success',
    external_user: 'bg-info/10 text-info',
    guest: 'bg-warning/10 text-warning',
};
const DEFAULT_ACCENT = 'bg-secondary/10 text-secondary';

type StatusFilter = 'all' | 'active' | 'inactive';

const Users: FC = () => {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleId, setRoleId] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce the search box so typing does not hammer the API.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        roleService
            .listAll()
            .then(setRoles)
            .catch(() => setRoles([]));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query: UserListQuery = {
                page,
                limit,
                sortBy,
                sortOrder,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(roleId ? { roleId } : {}),
                ...(status === 'all' ? {} : { isActive: status === 'active' }),
            };
            const result = await userService.list(query);
            setUsers(result.rows ?? []);
            setTotal(result.count ?? 0);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load users.');
            setUsers([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, limit, sortBy, sortOrder, debouncedSearch, roleId, status]);

    useEffect(() => {
        load();
    }, [load]);

    const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

    const filtersActive = Boolean(debouncedSearch || roleId || status !== 'all');

    const resetFilters = () => {
        setSearch('');
        setRoleId('');
        setStatus('all');
        setPage(1);
    };

    return (
        <Fragment>
            <Pageheader currentpage="Users" activepage="Users" mainpage="All users" />

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <div className="box">
                        <div className="box-header !block">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="box-title">
                                    Users
                                    <SpkBadge customClass="!bg-primary/10 !text-primary ms-2 !text-[0.75em] !py-[0.25rem] !px-[0.45rem]">
                                        {total}
                                    </SpkBadge>
                                </div>
                                <Link
                                    to={`${BASE}users/add`}
                                    className="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium shrink-0 whitespace-nowrap !mb-0"
                                >
                                    <i className="ri-user-add-line me-1 align-middle"></i>Add user
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <div className="relative grow sm:grow-0">
                                    <input
                                        type="search"
                                        className="form-control !py-[0.45rem] !ps-8 !text-[0.8rem] w-full sm:w-[15rem]"
                                        placeholder="Search name, email or mobile"
                                        aria-label="Search users"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className="ri-search-line absolute start-2 top-1/2 -translate-y-1/2 text-[0.85rem] text-[#8c9097] dark:text-white/50"></i>
                                </div>

                                <Select
                                    className="w-[10rem] shrink-0"
                                    ariaLabel="Filter by role"
                                    icon="ri-shield-user-line"
                                    value={roleId}
                                    onChange={(next) => {
                                        setRoleId(next);
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: '', label: 'All roles' },
                                        ...roles.map((role) => ({ value: role.id, label: humanise(role.name) })),
                                    ]}
                                />

                                <Select
                                    className="w-[10rem] shrink-0"
                                    ariaLabel="Filter by status"
                                    icon="ri-toggle-line"
                                    value={status}
                                    onChange={(next) => {
                                        setStatus(next as StatusFilter);
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: 'all', label: 'All statuses' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Disabled' },
                                    ]}
                                />

                                <Select
                                    className="w-[10.5rem] shrink-0"
                                    ariaLabel="Sort by"
                                    icon="ri-sort-desc"
                                    value={`${sortBy}:${sortOrder}`}
                                    onChange={(next) => {
                                        const [by, order] = next.split(':');
                                        setSortBy(by as 'createdAt' | 'name' | 'email');
                                        setSortOrder(order as 'ASC' | 'DESC');
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: 'createdAt:DESC', label: 'Newest first' },
                                        { value: 'createdAt:ASC', label: 'Oldest first' },
                                        { value: 'name:ASC', label: 'Name A–Z' },
                                        { value: 'name:DESC', label: 'Name Z–A' },
                                        { value: 'email:ASC', label: 'Email A–Z' },
                                    ]}
                                />

                                {filtersActive && (
                                    <SpkButton
                                        buttontype="button"
                                        onclickfunc={resetFilters}
                                        variant="light"
                                        customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !font-medium shrink-0 whitespace-nowrap !mb-0"
                                    >
                                        Clear
                                    </SpkButton>
                                )}
                            </div>
                        </div>

                        <div className="box-body !p-0">
                            <div className="table-responsive">
                                <Spktables
                                    tableClass="table whitespace-nowrap min-w-full ti-custom-table ti-custom-table-hover"
                                    headerClass="bg-light"
                                    tableRowclass="border-b border-defaultborder"
                                    header={[
                                        { title: 'User' },
                                        { title: 'Role' },
                                        { title: 'Mobile' },
                                        { title: 'Verified' },
                                        { title: 'Status' },
                                        { title: 'Joined' },
                                        { title: '', headerClassname: 'text-end' },
                                    ]}
                                >
                                    <TableState
                                        colSpan={7}
                                        loading={loading}
                                        error={error}
                                        empty={users.length === 0}
                                        emptyText={filtersActive ? 'No users match these filters.' : 'No users yet.'}
                                        onRetry={load}
                                    />

                                    {!loading &&
                                        !error &&
                                        users.map((user) => {
                                            const accent = ROLE_ACCENTS[user.role?.name ?? ''] ?? DEFAULT_ACCENT;
                                            return (
                                                <tr className="border-b border-defaultborder" key={user.id}>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`avatar avatar-sm avatar-rounded ${accent} inline-flex items-center justify-center !text-[0.7rem] font-semibold`}
                                                            >
                                                                {initials(user.name, user.email)}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <Link
                                                                    to={`${BASE}users/${user.id}`}
                                                                    className="font-semibold block leading-tight hover:text-primary"
                                                                >
                                                                    {user.name || 'Unnamed'}
                                                                </Link>
                                                                <span className="text-[0.6875rem] text-[#8c9097] dark:text-white/50">
                                                                    {user.email || 'No email'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <SpkBadge
                                                            customClass={`${accent.replace('/10', '/10')} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
                                                        >
                                                            {humanise(user.role?.name)}
                                                        </SpkBadge>
                                                    </td>
                                                    <td>{user.mobile || '—'}</td>
                                                    <td>
                                                        <div className="flex items-center gap-2 text-[0.75rem]">
                                                            <span
                                                                title={user.isEmailVerified ? 'Email verified' : 'Email not verified'}
                                                                className={user.isEmailVerified ? 'text-success' : 'text-[#8c9097] dark:text-white/50'}
                                                            >
                                                                <i className="ti ti-mail me-1"></i>
                                                                {user.isEmailVerified ? 'Yes' : 'No'}
                                                            </span>
                                                            <span
                                                                title={user.isPhoneVerified ? 'Phone verified' : 'Phone not verified'}
                                                                className={user.isPhoneVerified ? 'text-success' : 'text-[#8c9097] dark:text-white/50'}
                                                            >
                                                                <i className="ti ti-phone me-1"></i>
                                                                {user.isPhoneVerified ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <SpkBadge
                                                            customClass={`${user.isActive ? '!bg-success/10 !text-success' : '!bg-danger/10 !text-danger'} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
                                                        >
                                                            {user.isActive ? 'Active' : 'Disabled'}
                                                        </SpkBadge>
                                                    </td>
                                                    <td>{formatDateTime(user.createdAt)}</td>
                                                    <td className="text-end">
                                                        <Link
                                                            to={`${BASE}users/${user.id}`}
                                                            aria-label={`View ${user.name || user.email || 'user'}`}
                                                            className="text-primary text-[0.8125rem] whitespace-nowrap"
                                                        >
                                                            View
                                                            <i className="ti ti-arrow-narrow-right ms-1 align-middle"></i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </Spktables>
                            </div>
                        </div>

                        <div className="box-footer">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                total={total}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={(value) => {
                                    setLimit(value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default Users;
