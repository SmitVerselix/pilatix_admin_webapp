import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApexchartsComponent from '../../@spk/spk-packages/apexcharts-component';
import Spktables from '../../@spk/tables/spk-tables';
import SpkBadge from '../../@spk/uielements/spk-badge';
import SpkButton from '../../@spk/uielements/spk-button';
import StatCard from '../../components/common/stat-card/stat-card';
import TableState from '../../components/common/table/table-state';
import { ApiError } from '../../api/client';
import type { LoginHistoryEntry, Role } from '../../api/types';
import { useAuth } from '../../auth/use-auth';
import useThemeColors from '../../hooks/use-theme-colors';
import loginHistoryService from '../../services/login-history.service';
import roleService from '../../services/role.service';
import userService from '../../services/user.service';
import { describeUserAgent, formatDateTime, humanise } from '../../utils/format';

const BASE = import.meta.env.BASE_URL;

/**
 * Local-calendar day key. `toISOString()` would shift the day for any timezone
 * offset from UTC, dropping today's events out of the window.
 */
function localDayKey(date: Date) {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Buckets the last 14 days of activity for the area chart. */
function buildActivitySeries(entries: LoginHistoryEntry[]) {
    const days = 14;
    const labels: string[] = [];
    const logins: number[] = [];
    const logouts: number[] = [];

    const buckets = new Map<string, { login: number; logout: number }>();

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        buckets.set(localDayKey(date), { login: 0, logout: 0 });
        labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    }

    entries.forEach((entry) => {
        if (!entry.createdAt) return;
        const bucket = buckets.get(localDayKey(new Date(entry.createdAt)));
        if (!bucket) return;
        if (entry.type === 'logout') bucket.logout += 1;
        else bucket.login += 1;
    });

    buckets.forEach((bucket) => {
        logins.push(bucket.login);
        logouts.push(bucket.logout);
    });

    return { labels, logins, logouts };
}

const Dashboard: FC = () => {
    const { user } = useAuth();
    const colors = useThemeColors();

    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);

    const [userTotal, setUserTotal] = useState(0);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);

    const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const loadRoles = useCallback(async () => {
        setRolesLoading(true);
        setRolesError(null);
        try {
            setRoles(await roleService.listAll());
        } catch (err) {
            setRolesError(err instanceof ApiError ? err.message : 'Could not load roles.');
            setRoles([]);
        } finally {
            setRolesLoading(false);
        }
    }, []);

    // Only the count is needed here, so ask for the smallest possible page.
    const loadUserTotal = useCallback(async () => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const result = await userService.list({ page: 1, limit: 1 });
            setUserTotal(result.count ?? 0);
        } catch (err) {
            setUsersError(err instanceof ApiError ? err.message : 'Could not load users.');
            setUserTotal(0);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    // A wide page of history powers both the chart and the recent-activity table.
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const result = await loginHistoryService.list(1, 100);
            setHistory(result.items ?? []);
            setHistoryTotal(result.pagination?.total ?? 0);
        } catch (err) {
            setHistoryError(err instanceof ApiError ? err.message : 'Could not load login history.');
            setHistory([]);
            setHistoryTotal(0);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRoles();
        loadHistory();
        loadUserTotal();
    }, [loadRoles, loadHistory, loadUserTotal]);

    const activity = useMemo(() => buildActivitySeries(history), [history]);

    const loginCount = useMemo(() => history.filter((entry) => entry.type !== 'logout').length, [history]);

    const distinctDevices = useMemo(
        () => new Set(history.map((entry) => entry.deviceId).filter(Boolean)).size,
        [history],
    );

    const lastLogin = useMemo(
        () => history.find((entry) => entry.type !== 'logout') ?? null,
        [history],
    );

    const activityOptions: ApexCharts.ApexOptions = {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: [colors.primary, colors.danger],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90] } },
        grid: { borderColor: '#f2f5f7', strokeDashArray: 3 },
        xaxis: { categories: activity.labels, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { formatter: (value) => String(Math.round(value)) }, min: 0, tickAmount: 3 },
        legend: { position: 'top', horizontalAlign: 'right', markers: { size: 6 } },
        tooltip: { shared: true },
    };

    const recent = history.slice(0, 8);

    return (
        <Fragment>
            <div className="md:flex block items-center justify-between my-[1.5rem] page-header-breadcrumb">
                <div>
                    <p className="font-semibold text-[1.125rem] text-defaulttextcolor dark:text-defaulttextcolor/70 !mb-0">
                        Welcome back, {user?.name || user?.email || 'admin'}
                    </p>
                    <p className="font-normal text-[#8c9097] dark:text-white/50 text-[0.813rem]">
                        Access control and account activity for Pilatix.
                    </p>
                </div>
                <div className="btn-list md:mt-0 mt-2">
                    <SpkButton
                        buttontype="button"
                        onclickfunc={() => {
                            loadRoles();
                            loadHistory();
                            loadUserTotal();
                        }}
                        variant="outline-secondary"
                        customClass="ti-btn btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem] shadow-none"
                    >
                        <i className="ri-refresh-line inline-block me-1"></i>Refresh
                    </SpkButton>
                    <Link
                        to={`${BASE}users/add`}
                        className="ti-btn bg-primary text-white btn-wave !font-medium !ms-0 !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem] shadow-none"
                    >
                        <i className="ri-user-add-line inline-block me-1"></i>Add user
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6">
                <div className="xxl:col-span-3 sm:col-span-6 col-span-12">
                    <StatCard
                        title="Roles defined"
                        value={roles.length}
                        hint={roles.map((role) => role.name).slice(0, 3).join(', ') || 'None yet'}
                        icon="shield-lock"
                        color="primary"
                        to={`${BASE}roles`}
                        linkLabel="Manage"
                        loading={rolesLoading}
                    />
                </div>
                <div className="xxl:col-span-3 sm:col-span-6 col-span-12">
                    <StatCard
                        title="Recorded events"
                        value={historyTotal}
                        hint="Sign-in and sign-out entries"
                        icon="history"
                        color="secondary"
                        to={`${BASE}login-history`}
                        linkLabel="View log"
                        loading={historyLoading}
                    />
                </div>
                <div className="xxl:col-span-3 sm:col-span-6 col-span-12">
                    <StatCard
                        title="Logins tracked"
                        value={loginCount}
                        hint="In the latest 100 events"
                        icon="login"
                        color="info"
                        loading={historyLoading}
                    />
                </div>
                <div className="xxl:col-span-3 sm:col-span-6 col-span-12">
                    <StatCard
                        title="User accounts"
                        value={usersError ? '—' : userTotal}
                        hint={usersError ?? `${distinctDevices} device${distinctDevices === 1 ? '' : 's'} seen`}
                        icon="users"
                        color="success"
                        to={`${BASE}users`}
                        linkLabel="Browse"
                        loading={usersLoading}
                    />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6">
                <div className="xxl:col-span-8 col-span-12">
                    <div className="box">
                        <div className="box-header flex items-center justify-between">
                            <div className="box-title">Activity, last 14 days</div>
                            <Link to={`${BASE}login-history`} className="text-primary text-[0.75rem]">
                                Full history
                                <i className="ti ti-arrow-narrow-right ms-1 inline-block"></i>
                            </Link>
                        </div>
                        <div className="box-body">
                            {historyError ? (
                                <div className="text-center py-10">
                                    <p className="text-danger text-[0.8125rem] mb-2">
                                        <i className="ti ti-alert-circle me-1"></i>
                                        {historyError}
                                    </p>
                                    <SpkButton
                                        buttontype="button"
                                        onclickfunc={loadHistory}
                                        customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium"
                                    >
                                        Try again
                                    </SpkButton>
                                </div>
                            ) : (
                                <ApexchartsComponent
                                    chartOptions={activityOptions}
                                    chartSeries={[
                                        { name: 'Logins', data: activity.logins },
                                        { name: 'Logouts', data: activity.logouts },
                                    ]}
                                    type="area"
                                    height={300}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="xxl:col-span-4 col-span-12">
                    <div className="box">
                        <div className="box-header flex items-center justify-between">
                            <div className="box-title">Roles</div>
                            <Link to={`${BASE}roles`} className="text-primary text-[0.75rem]">
                                Manage
                            </Link>
                        </div>
                        <div className="box-body">
                            {rolesError ? (
                                <div className="text-center py-10">
                                    <p className="text-danger text-[0.8125rem] mb-2">
                                        <i className="ti ti-alert-circle me-1"></i>
                                        {rolesError}
                                    </p>
                                    <SpkButton
                                        buttontype="button"
                                        onclickfunc={loadRoles}
                                        customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium"
                                    >
                                        Try again
                                    </SpkButton>
                                </div>
                            ) : rolesLoading ? (
                                <div className="text-center py-10 text-[#8c9097] dark:text-white/50 text-[0.8125rem]">
                                    <i className="ti ti-loader animate-spin me-1"></i>Loading…
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-2">
                                        No roles defined yet.
                                    </p>
                                    <Link
                                        to={`${BASE}roles`}
                                        className="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium"
                                    >
                                        Create the first role
                                    </Link>
                                </div>
                            ) : (
                                <ul className="list-none mb-0">
                                    {roles.map((role) => (
                                        <li
                                            key={role.id}
                                            className="flex items-start gap-3 py-[0.6rem] border-b border-dashed border-defaultborder dark:border-defaultborder/10 last:border-0"
                                        >
                                            <span className="avatar avatar-sm avatar-rounded bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                                                <i className="ti ti-shield-lock text-[0.8125rem]"></i>
                                            </span>
                                            <div className="grow min-w-0">
                                                <p className="font-semibold text-[0.8125rem] mb-0 leading-tight">
                                                    {humanise(role.name)}
                                                </p>
                                                <span
                                                    className="text-[0.6875rem] text-[#8c9097] dark:text-white/50 block truncate"
                                                    title={role.description}
                                                >
                                                    {role.description || 'No description'}
                                                </span>
                                            </div>
                                            <SpkBadge
                                                customClass={`${role.isActive ? '!bg-success/10 !text-success' : '!bg-danger/10 !text-danger'} !text-[0.6875em] !py-[0.2rem] !px-[0.4rem] shrink-0`}
                                            >
                                                {role.isActive ? 'Active' : 'Inactive'}
                                            </SpkBadge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6">
                <div className="xxl:col-span-8 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Recent activity</div>
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
                                        { title: 'IP address' },
                                        { title: 'Device' },
                                    ]}
                                >
                                    <TableState
                                        colSpan={4}
                                        loading={historyLoading}
                                        error={historyError}
                                        empty={recent.length === 0}
                                        emptyText="No activity recorded yet."
                                        onRetry={loadHistory}
                                    />

                                    {!historyLoading &&
                                        !historyError &&
                                        recent.map((entry) => (
                                            <tr className="border-b border-defaultborder" key={entry.id}>
                                                <td>
                                                    <SpkBadge
                                                        customClass={`${entry.type === 'logout' ? '!bg-secondary/10 !text-secondary' : '!bg-success/10 !text-success'} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
                                                    >
                                                        {entry.type ?? 'unknown'}
                                                    </SpkBadge>
                                                </td>
                                                <td>{formatDateTime(entry.createdAt)}</td>
                                                <td>{entry.ipAddress || '—'}</td>
                                                <td title={entry.userAgent ?? undefined}>{describeUserAgent(entry.userAgent)}</td>
                                            </tr>
                                        ))}
                                </Spktables>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xxl:col-span-4 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Session</div>
                        </div>
                        <div className="box-body">
                            <ul className="list-none mb-0 text-[0.8125rem]">
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Signed in as</span>
                                    <span className="font-semibold truncate">{user?.email || '—'}</span>
                                </li>
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Role</span>
                                    <span className="font-semibold">{humanise(user?.role?.name)}</span>
                                </li>
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Last login</span>
                                    <span className="font-semibold">{formatDateTime(lastLogin?.createdAt)}</span>
                                </li>
                                <li className="flex justify-between gap-2 py-2">
                                    <span className="text-[#8c9097] dark:text-white/50">Last IP</span>
                                    <span className="font-semibold">{lastLogin?.ipAddress || '—'}</span>
                                </li>
                            </ul>
                            <Link
                                to={`${BASE}profile`}
                                className="ti-btn ti-btn-light !font-medium w-full !mb-0 mt-4 justify-center"
                            >
                                <i className="ti ti-user-circle me-1"></i>Edit profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default Dashboard;
