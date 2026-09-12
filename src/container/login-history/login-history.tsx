import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Pageheader from '../../components/common/page-header/pageheader';
import Spktables from '../../@spk/tables/spk-tables';
import SpkBadge from '../../@spk/uielements/spk-badge';
import SpkButton from '../../@spk/uielements/spk-button';
import Pagination from '../../components/common/table/pagination';
import TableState from '../../components/common/table/table-state';
import { ApiError } from '../../api/client';
import type { LoginHistoryEntry } from '../../api/types';
import loginHistoryService from '../../services/login-history.service';
import { describeUserAgent, formatDateTime } from '../../utils/format';

const TYPE_STYLES: Record<string, string> = {
    login: '!bg-success/10 !text-success',
    logout: '!bg-secondary/10 !text-secondary',
};

const LoginHistory: FC = () => {
    const [items, setItems] = useState<LoginHistoryEntry[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'login' | 'logout'>('all');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginHistoryService.list(page, limit);
            setItems(result.items ?? []);
            setTotal(result.pagination?.total ?? 0);
            setTotalPages(Math.max(result.pagination?.totalPages ?? 1, 1));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load login history.');
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        load();
    }, [load]);

    // The API paginates but does not filter by type, so this narrows the page in view.
    const visible = useMemo(
        () => (typeFilter === 'all' ? items : items.filter((entry) => entry.type === typeFilter)),
        [items, typeFilter],
    );

    return (
        <Fragment>
            <Pageheader currentpage="Login history" activepage="Activity" mainpage="Login history" />

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <div className="box">
                        <div className="box-header !block">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="box-title">
                                        Your sign-in activity
                                        <SpkBadge customClass="!bg-primary/10 !text-primary ms-2 !text-[0.75em] !py-[0.25rem] !px-[0.45rem]">
                                            {total}
                                        </SpkBadge>
                                    </div>
                                    <p className="text-[0.6875rem] text-[#8c9097] dark:text-white/50 mb-0 mt-1">
                                        The API scopes this list to the signed-in account.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        className="form-control !w-auto !py-[0.45rem] !text-[0.8rem] shrink-0"
                                        aria-label="Filter by event type"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value as 'all' | 'login' | 'logout')}
                                    >
                                        <option value="all">All events</option>
                                        <option value="login">Logins</option>
                                        <option value="logout">Logouts</option>
                                    </select>
                                    <SpkButton
                                        buttontype="button"
                                        onclickfunc={load}
                                        variant="light"
                                        customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !font-medium shrink-0 whitespace-nowrap !mb-0"
                                    >
                                        <i className="ri-refresh-line me-1 align-middle"></i>Refresh
                                    </SpkButton>
                                </div>
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
                                        loading={loading}
                                        error={error}
                                        empty={visible.length === 0}
                                        emptyText={
                                            typeFilter === 'all'
                                                ? 'No login history recorded yet.'
                                                : `No ${typeFilter} events on this page.`
                                        }
                                        onRetry={load}
                                    />

                                    {!loading &&
                                        !error &&
                                        visible.map((entry) => (
                                            <tr className="border-b border-defaultborder" key={entry.id}>
                                                <td>
                                                    <SpkBadge
                                                        customClass={`${TYPE_STYLES[entry.type ?? ''] ?? '!bg-info/10 !text-info'} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
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
                                                <td className="max-w-[16rem] truncate" title={entry.reason ?? undefined}>
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

export default LoginHistory;
