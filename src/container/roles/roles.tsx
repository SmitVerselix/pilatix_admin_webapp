import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Pageheader from '../../components/common/page-header/pageheader';
import Spktables from '../../@spk/tables/spk-tables';
import SpkButton from '../../@spk/uielements/spk-button';
import SpkBadge from '../../@spk/uielements/spk-badge';
import Pagination from '../../components/common/table/pagination';
import TableState from '../../components/common/table/table-state';
import ConfirmDialog from '../../components/common/confirm-dialog';
import RoleModal from './role-modal';
import { ApiError } from '../../api/client';
import type { Role } from '../../api/types';
import roleService from '../../services/role.service';
import { formatDateTime, humanise } from '../../utils/format';

/** Colour per role name, so the badge reads at a glance. */
const ROLE_COLORS: Record<string, string> = {
    admin: 'primary',
    user: 'success',
    external_user: 'info',
    guest: 'warning',
};

const Roles: FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState<Role | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    /** Names in use, so the create form only offers what is still free. */
    const [takenNames, setTakenNames] = useState<string[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await roleService.list({
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            setRoles(result.rows ?? []);
            setTotal(result.count ?? 0);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load roles.');
            setRoles([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, limit, sortOrder, debouncedSearch]);

    useEffect(() => {
        load();
    }, [load]);

    // Unfiltered names for the create form's select.
    const loadTakenNames = useCallback(async () => {
        try {
            const all = await roleService.listAll();
            setTakenNames(all.map((role) => role.name));
        } catch {
            setTakenNames([]);
        }
    }, []);

    useEffect(() => {
        loadTakenNames();
    }, [loadTakenNames]);

    // Debounce the search box so typing does not hammer the API.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

    const handleSaved = (message: string) => {
        setModalOpen(false);
        setEditing(null);
        toast.success(message);
        load();
        loadTakenNames();
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const result = await roleService.remove(deleting.id);
            toast.success(result.message || 'Role deleted.');
            setDeleting(null);
            // Step back a page if the last row on this page is gone.
            if (roles.length === 1 && page > 1) setPage(page - 1);
            else load();
            loadTakenNames();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Could not delete the role.');
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <Fragment>
            <Pageheader currentpage="Roles" activepage="Access control" mainpage="Roles" />

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <div className="box">
                        <div className="box-header !block">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="box-title">
                                    Roles
                                    <SpkBadge customClass="!bg-primary/10 !text-primary ms-2 !text-[0.75em] !py-[0.25rem] !px-[0.45rem]">
                                        {total}
                                    </SpkBadge>
                                </div>
                                <SpkButton
                                    buttontype="button"
                                    onclickfunc={() => {
                                        setEditing(null);
                                        setModalOpen(true);
                                    }}
                                    customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium shrink-0 whitespace-nowrap !mb-0"
                                >
                                    <i className="ri-add-line me-1 align-middle"></i>Add role
                                </SpkButton>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <div className="relative grow sm:grow-0">
                                    <input
                                        type="search"
                                        className="form-control !py-[0.45rem] !ps-8 !text-[0.8rem] w-full sm:w-[14rem]"
                                        placeholder="Search roles"
                                        aria-label="Search roles"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className="ri-search-line absolute start-2 top-1/2 -translate-y-1/2 text-[0.85rem] text-[#8c9097] dark:text-white/50"></i>
                                </div>
                                <select
                                    className="form-control !w-auto !py-[0.45rem] !text-[0.8rem] shrink-0"
                                    aria-label="Sort order"
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as 'ASC' | 'DESC');
                                        setPage(1);
                                    }}
                                >
                                    <option value="DESC">Newest first</option>
                                    <option value="ASC">Oldest first</option>
                                </select>
                            </div>
                        </div>

                        <div className="box-body !p-0">
                            <div className="table-responsive">
                                <Spktables
                                    tableClass="table whitespace-nowrap min-w-full ti-custom-table ti-custom-table-hover"
                                    headerClass="bg-light"
                                    tableRowclass="border-b border-defaultborder"
                                    header={[
                                        { title: 'Name' },
                                        { title: 'Description' },
                                        { title: 'Status' },
                                        { title: 'Created' },
                                        { title: 'Actions', headerClassname: 'text-end' },
                                    ]}
                                >
                                    <TableState
                                        colSpan={5}
                                        loading={loading}
                                        error={error}
                                        empty={roles.length === 0}
                                        emptyText={debouncedSearch ? `No roles match “${debouncedSearch}”.` : 'No roles yet.'}
                                        onRetry={load}
                                    />

                                    {!loading &&
                                        !error &&
                                        roles.map((role) => (
                                            <tr className="border-b border-defaultborder" key={role.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`avatar avatar-xs avatar-rounded bg-${ROLE_COLORS[role.name] ?? 'secondary'}/10 text-${ROLE_COLORS[role.name] ?? 'secondary'} inline-flex items-center justify-center`}
                                                        >
                                                            <i className="ti ti-shield-lock text-[0.75rem]"></i>
                                                        </span>
                                                        <div>
                                                            <span className="font-semibold block leading-tight">
                                                                {humanise(role.name)}
                                                            </span>
                                                            <span className="text-[0.6875rem] text-[#8c9097] dark:text-white/50">
                                                                {role.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="max-w-[22rem] truncate" title={role.description}>
                                                    {role.description || '—'}
                                                </td>
                                                <td>
                                                    <SpkBadge
                                                        customClass={`${role.isActive ? '!bg-success/10 !text-success' : '!bg-danger/10 !text-danger'} !text-[0.75em] !py-[0.25rem] !px-[0.45rem]`}
                                                    >
                                                        {role.isActive ? 'Active' : 'Inactive'}
                                                    </SpkBadge>
                                                </td>
                                                <td>{formatDateTime(role.createdAt)}</td>
                                                <td className="text-end">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to="#"
                                                            aria-label={`Edit ${role.name}`}
                                                            className="text-info text-[0.875rem] leading-none"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setEditing(role);
                                                                setModalOpen(true);
                                                            }}
                                                        >
                                                            <i className="ri-edit-line"></i>
                                                        </Link>
                                                        <Link
                                                            to="#"
                                                            aria-label={`Delete ${role.name}`}
                                                            className="text-danger text-[0.875rem] leading-none"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setDeleting(role);
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-5-line"></i>
                                                        </Link>
                                                    </div>
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

            <RoleModal
                open={modalOpen}
                role={editing}
                takenNames={takenNames}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                busy={deleteBusy}
                title="Delete this role?"
                message={
                    <>
                        <b>{deleting ? humanise(deleting.name) : ''}</b> will be removed. Users still pointing at this role
                        keep the reference, so reassign them first.
                    </>
                }
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
            />
        </Fragment>
    );
};

export default Roles;
