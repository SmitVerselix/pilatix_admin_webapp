import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Pageheader from '../../components/common/page-header/pageheader';
import Spktables from '../../@spk/tables/spk-tables';
import SpkBadge from '../../@spk/uielements/spk-badge';
import SpkButton from '../../@spk/uielements/spk-button';
import Select from '../../components/common/form/select';
import Pagination from '../../components/common/table/pagination';
import TableState from '../../components/common/table/table-state';
import { ApiError } from '../../api/client';
import type { LoginHistoryEntry, UserDetail as UserDetailType } from '../../api/types';
import userService from '../../services/user.service';
import { describeUserAgent, formatDateTime, humanise, initials } from '../../utils/format';

const BASE = import.meta.env.BASE_URL;

const ROLE_ACCENTS: Record<string, string> = {
    superadmin: 'bg-primary/10 text-primary',
    admin: 'bg-primary/10 text-primary',
    user: 'bg-success/10 text-success',
    external_user: 'bg-info/10 text-info',
    guest: 'bg-warning/10 text-warning',
};
const DEFAULT_ACCENT = 'bg-secondary/10 text-secondary';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <li className="flex justify-between gap-3 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10 last:border-0">
        <span className="text-[#8c9097] dark:text-white/50 shrink-0">{label}</span>
        <span className="font-semibold text-end break-words min-w-0">{children}</span>
    </li>
);

/**
 * Everything the admin APIs expose about one account:
 * `get-user-by-id` for the profile, role and devices, and
 * `get-login-history-by-user-id` for that account's paginated activity.
 */
const UserDetail: FC = () => {
    const { userId = '' } = useParams();

    const [user, setUser] = useState<UserDetailType | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const loadUser = useCallback(async () => {
        if (!userId) return;
        setUserLoading(true);
        setUserError(null);
        try {
            setUser(await userService.getById(userId));
        } catch (err) {
            setUserError(err instanceof ApiError ? err.message : 'Could not load this user.');
            setUser(null);
        } finally {
            setUserLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const loadHistory = useCallback(async () => {
        if (!userId) return;
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const result = await userService.loginHistory({
                userId,
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            setHistory(result.rows ?? []);
            setTotal(result.count ?? 0);
        } catch (err) {
            setHistoryError(err instanceof ApiError ? err.message : 'Could not load login history.');
            setHistory([]);
            setTotal(0);
        } finally {
            setHistoryLoading(false);
        }
    }, [userId, page, limit, sortOrder, debouncedSearch]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);
    const accent = ROLE_ACCENTS[user?.role?.name ?? ''] ?? DEFAULT_ACCENT;
    const devices = user?.devices ?? [];

    if (userError) {
        return (
            <Fragment>
                <Pageheader currentpage="User" activepage="Users" mainpage="Details" />
                <div className="box">
                    <div className="box-body text-center py-12">
                        <span className="avatar avatar-lg avatar-rounded bg-danger/10 text-danger mb-3 inline-flex items-center justify-center">
                            <i className="ti ti-alert-circle text-[1.25rem]"></i>
                        </span>
                        <p className="font-semibold text-[0.9375rem] mb-1">{userError}</p>
                        <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-4">
                            The account may have been removed, or the link is wrong.
                        </p>
                        <Link
                            to={`${BASE}users`}
                            className="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium"
                        >
                            Back to all users
                        </Link>
                    </div>
                </div>
            </Fragment>
        );
    }

    return (
        <Fragment>
            <Pageheader currentpage={user?.name || 'User'} activepage="Users" mainpage="Details" />

            <div className="mb-4">
                <Link to={`${BASE}users`} className="text-primary text-[0.8125rem]">
                    <i className="ti ti-arrow-narrow-left me-1 align-middle"></i>All users
                </Link>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* ---------- profile ---------- */}
                <div className="xl:col-span-4 col-span-12">
                    <div className="box">
                        <div className="box-body text-center">
                            {userLoading ? (
                                <div className="py-10 text-[#8c9097] dark:text-white/50 text-[0.8125rem]">
                                    <i className="ti ti-loader animate-spin me-1"></i>Loading…
                                </div>
                            ) : (
                                <Fragment>
                                    {user?.profileImage ? (
                                        <img
                                            src={user.profileImage}
                                            alt={user.name || 'Profile'}
                                            className="avatar avatar-xxl avatar-rounded mb-3 inline-block object-cover"
                                        />
                                    ) : (
                                        <span
                                            className={`avatar avatar-xxl avatar-rounded ${accent} inline-flex items-center justify-center text-[1.25rem] font-semibold mb-3`}
                                        >
                                            {initials(user?.name, user?.email)}
                                        </span>
                                    )}
                                    <h6 className="font-semibold text-[1rem] mb-1">{user?.name || 'Unnamed account'}</h6>
                                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-2 break-all">
                                        {user?.email || 'No email'}
                                    </p>
                                    <SpkBadge customClass={`${accent} !text-[0.75em] !py-[0.25rem] !px-[0.5rem]`}>
                                        {humanise(user?.role?.name)}
                                    </SpkBadge>
                                    {user?.role?.description && (
                                        <p className="text-[0.6875rem] text-[#8c9097] dark:text-white/50 mt-2 mb-0">
                                            {user.role.description}
                                        </p>
                                    )}
                                </Fragment>
                            )}
                        </div>

                        {!userLoading && user && (
                            <div className="box-footer">
                                <ul className="list-none mb-0 text-[0.8125rem]">
                                    <Row label="Status">
                                        <span className={user.isActive ? 'text-success' : 'text-danger'}>
                                            {user.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </Row>
                                    <Row label="Mobile">{user.mobile || '—'}</Row>
                                    <Row label="Email verified">
                                        <span className={user.isEmailVerified ? 'text-success' : 'text-warning'}>
                                            {user.isEmailVerified ? 'Yes' : 'No'}
                                        </span>
                                    </Row>
                                    <Row label="Phone verified">
                                        <span className={user.isPhoneVerified ? 'text-success' : 'text-warning'}>
                                            {user.isPhoneVerified ? 'Yes' : 'No'}
                                        </span>
                                    </Row>
                                    <Row label="Sign-in method">
                                        {user.socialProvider ? humanise(user.socialProvider) : 'Email & password'}
                                    </Row>
                                    <Row label="Joined">{formatDateTime(user.createdAt)}</Row>
                                    <Row label="Last active">{formatDateTime(user.lastActiveAt)}</Row>
                                    <Row label="User ID">
                                        <span className="text-[0.6875rem] break-all">{user.id}</span>
                                    </Row>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* ---------- devices ---------- */}
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">
                                Devices
                                <SpkBadge customClass="!bg-primary/10 !text-primary ms-2 !text-[0.75em] !py-[0.25rem] !px-[0.45rem]">
                                    {devices.length}
                                </SpkBadge>
                            </div>
                        </div>
                        <div className="box-body">
                            {userLoading ? (
                                <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0">Loading…</p>
                            ) : devices.length === 0 ? (
                                <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0">
                                    No devices registered for this account.
                                </p>
                            ) : (
                                <ul className="list-none mb-0">
                                    {devices.map((device) => (
                                        <li
                                            key={device.id}
                                            className="flex items-start gap-3 py-[0.6rem] border-b border-dashed border-defaultborder dark:border-defaultborder/10 last:border-0"
                                        >
                                            <span className="avatar avatar-sm avatar-rounded bg-secondary/10 text-secondary inline-flex items-center justify-center shrink-0">
                                                <i
                                                    className={`ti ${device.deviceType === 'web' ? 'ti-device-desktop' : 'ti-device-mobile'} text-[0.8125rem]`}
                                                ></i>
                                            </span>
                                            <div className="grow min-w-0">
                                                <p className="font-semibold text-[0.8125rem] mb-0 leading-tight">
                                                    {device.deviceName || humanise(device.deviceType) || 'Unknown device'}
                                                </p>
                                                <span className="text-[0.6875rem] text-[#8c9097] dark:text-white/50 block truncate">
                                                    {device.ipAddress || 'No IP'} ·{' '}
                                                    {device.lastLogin ? formatDateTime(device.lastLogin) : 'Never signed in'}
                                                </span>
                                            </div>
                                            <SpkBadge
                                                customClass={`${device.isActive ? '!bg-success/10 !text-success' : '!bg-secondary/10 !text-secondary'} !text-[0.6875em] !py-[0.2rem] !px-[0.4rem] shrink-0`}
                                            >
                                                {device.isActive ? 'Active' : 'Signed out'}
                                            </SpkBadge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* ---------- login history ---------- */}
                <div className="xl:col-span-8 col-span-12">
                    <div className="box">
                        <div className="box-header !block">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="box-title">
                                    Login history
                                    <SpkBadge customClass="!bg-primary/10 !text-primary ms-2 !text-[0.75em] !py-[0.25rem] !px-[0.45rem]">
                                        {total}
                                    </SpkBadge>
                                </div>
                                <SpkButton
                                    buttontype="button"
                                    onclickfunc={() => {
                                        loadUser();
                                        loadHistory();
                                    }}
                                    variant="light"
                                    customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !font-medium shrink-0 whitespace-nowrap !mb-0"
                                >
                                    <i className="ri-refresh-line me-1 align-middle"></i>Refresh
                                </SpkButton>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <div className="relative grow sm:grow-0">
                                    <input
                                        type="search"
                                        className="form-control !py-[0.45rem] !ps-8 !text-[0.8rem] w-full sm:w-[16rem]"
                                        placeholder="Search IP, device, type or reason"
                                        aria-label="Search login history"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className="ri-search-line absolute start-2 top-1/2 -translate-y-1/2 text-[0.85rem] text-[#8c9097] dark:text-white/50"></i>
                                </div>
                                <Select
                                    className="w-[10.5rem] shrink-0"
                                    ariaLabel="Sort order"
                                    icon="ri-sort-desc"
                                    value={sortOrder}
                                    onChange={(next) => {
                                        setSortOrder(next as 'ASC' | 'DESC');
                                        setPage(1);
                                    }}
                                    options={[
                                        { value: 'DESC', label: 'Newest first' },
                                        { value: 'ASC', label: 'Oldest first' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="box-body !p-0">
                            <div className="table-responsive">
                                <Spktables
                                    tableClass="table whitespace-nowrap min-w-full ti-custom-table ti-custom-table-hover"
                                    headerClass="bg-light"
                                    tableRowclass="border-b border-defaultborder"
                                    header={[
                                        { title: 'Event' },
                                        { title: 'When' },
                                        { title: 'Status' },
                                        { title: 'IP address' },
                                        { title: 'Device' },
                                        { title: 'Reason' },
                                    ]}
                                >
                                    <TableState
                                        colSpan={6}
                                        loading={historyLoading}
                                        error={historyError}
                                        empty={history.length === 0}
                                        emptyText={
                                            debouncedSearch
                                                ? `Nothing matches “${debouncedSearch}”.`
                                                : 'No activity recorded for this account.'
                                        }
                                        onRetry={loadHistory}
                                    />

                                    {!historyLoading &&
                                        !historyError &&
                                        history.map((entry) => (
                                            <tr className="border-b border-defaultborder" key={entry.id}>
                                                <td>
                                                    <SpkBadge
                                                        customClass={`${entry.type === 'logout' ? '!bg-secondary/10 !text-secondary' : '!bg-success/10 !text-success'} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
                                                    >
                                                        <i
                                                            className={`ti ${entry.type === 'logout' ? 'ti-logout' : 'ti-login'} me-1 align-middle`}
                                                        ></i>
                                                        {entry.type ?? 'unknown'}
                                                    </SpkBadge>
                                                </td>
                                                <td>{formatDateTime(entry.createdAt)}</td>
                                                <td>
                                                    <span
                                                        className={`text-[0.8125rem] font-semibold ${entry.status === 'success' ? 'text-success' : 'text-danger'}`}
                                                    >
                                                        {entry.status ?? '—'}
                                                    </span>
                                                </td>
                                                <td>{entry.ipAddress || '—'}</td>
                                                <td title={entry.userAgent ?? undefined}>
                                                    {describeUserAgent(entry.userAgent)}
                                                </td>
                                                <td className="max-w-[14rem] truncate" title={entry.reason ?? undefined}>
                                                    {entry.reason || '—'}
                                                </td>
                                            </tr>
                                        ))}
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

export default UserDetail;
