import { FC, Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Pageheader from '../../components/common/page-header/pageheader';
import SpkButton from '../../@spk/uielements/spk-button';
import Select from '../../components/common/form/select';
import { ApiError } from '../../api/client';
import type { Role, User } from '../../api/types';
import authService from '../../services/auth.service';
import roleService from '../../services/role.service';
import { humanise } from '../../utils/format';

interface FormState {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    mobile: string;
    roleId: string;
}

const EMPTY: FormState = { name: '', email: '', password: '', confirmPassword: '', mobile: '', roleId: '' };

/**
 * Creates an account through POST /admin/auth/register. The backend requires a
 * roleId, so roles are loaded first. New accounts show up under All users
 * (POST /admin/dashboard/list-users).
 */
const AddUser: FC = () => {
    const [form, setForm] = useState<FormState>(EMPTY);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesError, setRolesError] = useState<string | null>(null);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [created, setCreated] = useState<User | null>(null);

    useEffect(() => {
        let cancelled = false;
        setRolesLoading(true);
        roleService
            .listAll()
            .then((rows) => {
                if (!cancelled) {
                    setRoles(rows);
                    setRolesError(rows.length === 0 ? 'No roles exist yet. Create a role first.' : null);
                }
            })
            .catch((err) => {
                if (!cancelled) setRolesError(err instanceof ApiError ? err.message : 'Could not load roles.');
            })
            .finally(() => {
                if (!cancelled) setRolesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    /** Mirrors the Joi schema on AuthController.register. */
    const validate = () => {
        const next: Partial<Record<keyof FormState, string>> = {};
        if (!form.name.trim()) next.name = 'Name is required.';
        if (!form.email.trim()) next.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
        if (!form.password) next.password = 'Password is required.';
        else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
        if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
        if (!form.roleId) next.roleId = 'Pick a role.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const result = await authService.register({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                roleId: form.roleId,
                ...(form.mobile.trim() ? { mobile: form.mobile.trim() } : {}),
            });
            toast.success(result.message || 'User created.');
            setCreated(result.payload.user);
            setForm(EMPTY);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Could not create the user.');
        } finally {
            setSubmitting(false);
        }
    };

    const fieldError = (key: keyof FormState) =>
        errors[key] ? <span className="block text-danger text-[0.6875rem] mt-1">{errors[key]}</span> : null;

    return (
        <Fragment>
            <Pageheader currentpage="Add user" activepage="Users" mainpage="Add user" />

            <div className="grid grid-cols-12 gap-6">
                <div className="xl:col-span-8 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Create an account</div>
                        </div>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="box-body">
                                {rolesError && (
                                    <div className="bg-warning/10 text-warning text-[0.8125rem] rounded-md px-3 py-2 mb-4" role="alert">
                                        <i className="ti ti-alert-triangle me-1 align-middle"></i>
                                        {rolesError}
                                    </div>
                                )}

                                <div className="grid grid-cols-12 gap-4">
                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="user-name" className="form-label">
                                            Full name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="user-name"
                                            type="text"
                                            className="form-control"
                                            placeholder="Jane Cooper"
                                            value={form.name}
                                            onChange={set('name')}
                                        />
                                        {fieldError('name')}
                                    </div>

                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="user-email" className="form-label">
                                            Email <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="user-email"
                                            type="email"
                                            className="form-control"
                                            placeholder="jane@example.com"
                                            value={form.email}
                                            onChange={set('email')}
                                        />
                                        {fieldError('email')}
                                    </div>

                                    <div className="xl:col-span-6 col-span-12">
                                        <label id="user-role-label" htmlFor="user-role" className="form-label">
                                            Role <span className="text-danger">*</span>
                                        </label>
                                        <Select
                                            id="user-role"
                                            size="md"
                                            labelledBy="user-role-label"
                                            placeholder={rolesLoading ? 'Loading roles…' : 'Select a role'}
                                            invalid={Boolean(errors.roleId)}
                                            value={form.roleId}
                                            onChange={(next) => {
                                                setForm((prev) => ({ ...prev, roleId: next }));
                                                setErrors((prev) => ({ ...prev, roleId: undefined }));
                                            }}
                                            disabled={rolesLoading || roles.length === 0}
                                            options={roles.map((role) => ({
                                                value: role.id,
                                                label: humanise(role.name),
                                                hint: role.name,
                                            }))}
                                        />
                                        {fieldError('roleId')}
                                    </div>

                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="user-mobile" className="form-label">
                                            Mobile
                                        </label>
                                        <input
                                            id="user-mobile"
                                            type="tel"
                                            className="form-control"
                                            placeholder="Optional"
                                            value={form.mobile}
                                            onChange={set('mobile')}
                                        />
                                    </div>

                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="user-password" className="form-label">
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                id="user-password"
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control !border-s !rounded-s-md"
                                                autoComplete="new-password"
                                                placeholder="At least 6 characters"
                                                value={form.password}
                                                onChange={set('password')}
                                            />
                                            <SpkButton
                                                buttontype="button"
                                                Label="Toggle password visibility"
                                                variant="light"
                                                customClass="ti-btn !rounded-s-none !mb-0"
                                                onclickfunc={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} align-middle`}></i>
                                            </SpkButton>
                                        </div>
                                        {fieldError('password')}
                                    </div>

                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="user-confirm" className="form-label">
                                            Confirm password <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="user-confirm"
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-control"
                                            autoComplete="new-password"
                                            placeholder="Repeat the password"
                                            value={form.confirmPassword}
                                            onChange={set('confirmPassword')}
                                        />
                                        {fieldError('confirmPassword')}
                                    </div>
                                </div>
                            </div>
                            <div className="box-footer flex items-center justify-end gap-2">
                                <SpkButton
                                    buttontype="button"
                                    variant="light"
                                    customClass="ti-btn !font-medium"
                                    onclickfunc={() => {
                                        setForm(EMPTY);
                                        setErrors({});
                                    }}
                                >
                                    Reset
                                </SpkButton>
                                <SpkButton
                                    buttontype="submit"
                                    disabled={submitting || roles.length === 0}
                                    customClass="ti-btn !bg-primary !text-white !font-medium disabled:opacity-60"
                                >
                                    {submitting ? 'Creating…' : 'Create user'}
                                </SpkButton>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-4 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Last created</div>
                        </div>
                        <div className="box-body">
                            {created ? (
                                <ul className="list-none mb-0 text-[0.8125rem]">
                                    <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                        <span className="text-[#8c9097] dark:text-white/50">Name</span>
                                        <span className="font-semibold">{created.name || '—'}</span>
                                    </li>
                                    <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                        <span className="text-[#8c9097] dark:text-white/50">Email</span>
                                        <span className="font-semibold truncate">{created.email || '—'}</span>
                                    </li>
                                    <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                        <span className="text-[#8c9097] dark:text-white/50">Mobile</span>
                                        <span className="font-semibold">{created.mobile || '—'}</span>
                                    </li>
                                    <li className="flex justify-between gap-2 py-2">
                                        <span className="text-[#8c9097] dark:text-white/50">User ID</span>
                                        <span className="font-semibold text-[0.6875rem] break-all">{created.id}</span>
                                    </li>
                                </ul>
                            ) : (
                                <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0">
                                    Accounts you create in this session appear here. The full directory lives under{' '}
                                    <Link to={`${import.meta.env.BASE_URL}users`} className="text-primary">
                                        All users
                                    </Link>
                                    .
                                </p>
                            )}

                            <Link
                                to={`${import.meta.env.BASE_URL}users`}
                                className="ti-btn ti-btn-light !font-medium w-full justify-center !mb-0 mt-3"
                            >
                                <i className="ti ti-users me-1"></i>View all users
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default AddUser;
