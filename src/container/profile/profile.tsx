import { FC, Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Pageheader from '../../components/common/page-header/pageheader';
import SpkButton from '../../@spk/uielements/spk-button';
import SpkBadge from '../../@spk/uielements/spk-badge';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/use-auth';
import authService from '../../services/auth.service';
import { formatDateTime, humanise, initials } from '../../utils/format';

/**
 * Reads and updates the signed-in account through the `web` route group
 * (`/web/user/profile/profile`) - the admin group does not mount those handlers.
 */
const Profile: FC = () => {
    const { user, refreshProfile } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    useEffect(() => {
        refreshProfile().then((fresh) => {
            if (fresh) {
                setName(fresh.name ?? '');
                setEmail(fresh.email ?? '');
                setLoadError(null);
            }
        });
        // Run once on mount; refreshProfile is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dirty = (name ?? '') !== (user?.name ?? '') || (email ?? '') !== (user?.email ?? '');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const next: { name?: string; email?: string } = {};
        if (!name.trim()) next.name = 'Name cannot be empty.';
        if (!email.trim()) next.email = 'Email cannot be empty.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        // The API accepts a partial body; send only what actually changed.
        const body: { name?: string; email?: string } = {};
        if (name.trim() !== (user?.name ?? '')) body.name = name.trim();
        if (email.trim() !== (user?.email ?? '')) body.email = email.trim();

        if (Object.keys(body).length === 0) {
            toast('Nothing to save.');
            return;
        }

        setSaving(true);
        try {
            const result = await authService.updateProfile(body);
            toast.success(result.message || 'Profile updated.');
            await refreshProfile();
        } catch (err) {
            const messageText = err instanceof ApiError ? err.message : 'Could not update the profile.';
            toast.error(messageText);
            setLoadError(messageText);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Fragment>
            <Pageheader currentpage="Profile" activepage="Account" mainpage="Profile" />

            <div className="grid grid-cols-12 gap-6">
                <div className="xl:col-span-4 col-span-12">
                    <div className="box">
                        <div className="box-body text-center">
                            <span className="avatar avatar-xxl avatar-rounded bg-primary/10 text-primary inline-flex items-center justify-center text-[1.25rem] font-semibold mb-3">
                                {initials(user?.name, user?.email)}
                            </span>
                            <h6 className="font-semibold text-[1rem] mb-1">{user?.name || 'Unnamed account'}</h6>
                            <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-2">{user?.email || '—'}</p>
                            <SpkBadge customClass="!bg-primary/10 !text-primary !text-[0.75em] !py-[0.25rem] !px-[0.5rem]">
                                {humanise(user?.role?.name)}
                            </SpkBadge>
                        </div>
                        <div className="box-footer">
                            <ul className="list-none mb-0 text-[0.8125rem]">
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Mobile</span>
                                    <span className="font-semibold">{user?.mobile || '—'}</span>
                                </li>
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Email verified</span>
                                    <span className={`font-semibold ${user?.isEmailVerified ? 'text-success' : 'text-warning'}`}>
                                        {user?.isEmailVerified ? 'Yes' : 'No'}
                                    </span>
                                </li>
                                <li className="flex justify-between gap-2 py-2 border-b border-dashed border-defaultborder dark:border-defaultborder/10">
                                    <span className="text-[#8c9097] dark:text-white/50">Account status</span>
                                    <span className={`font-semibold ${user?.isActive ? 'text-success' : 'text-danger'}`}>
                                        {user?.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </li>
                                <li className="flex justify-between gap-2 py-2">
                                    <span className="text-[#8c9097] dark:text-white/50">Member since</span>
                                    <span className="font-semibold">{formatDateTime(user?.createdAt)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-8 col-span-12">
                    <div className="box">
                        <div className="box-header">
                            <div className="box-title">Account details</div>
                        </div>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="box-body">
                                {loadError && (
                                    <div className="bg-danger/10 text-danger text-[0.8125rem] rounded-md px-3 py-2 mb-4" role="alert">
                                        <i className="ti ti-alert-circle me-1 align-middle"></i>
                                        {loadError}
                                    </div>
                                )}
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="profile-name" className="form-label">
                                            Full name
                                        </label>
                                        <input
                                            id="profile-name"
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setErrors((prev) => ({ ...prev, name: undefined }));
                                            }}
                                        />
                                        {errors.name && (
                                            <span className="block text-danger text-[0.6875rem] mt-1">{errors.name}</span>
                                        )}
                                    </div>
                                    <div className="xl:col-span-6 col-span-12">
                                        <label htmlFor="profile-email" className="form-label">
                                            Email
                                        </label>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            className="form-control"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setErrors((prev) => ({ ...prev, email: undefined }));
                                            }}
                                        />
                                        {errors.email && (
                                            <span className="block text-danger text-[0.6875rem] mt-1">{errors.email}</span>
                                        )}
                                    </div>
                                    <div className="col-span-12">
                                        <label className="form-label">User ID</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light"
                                            value={user?.id ?? ''}
                                            readOnly
                                            aria-label="User ID"
                                        />
                                        <span className="block text-[0.6875rem] text-[#8c9097] dark:text-white/50 mt-1">
                                            Read-only. The API exposes name and email for editing.
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="box-footer flex items-center justify-end gap-2">
                                <SpkButton
                                    buttontype="button"
                                    variant="light"
                                    customClass="ti-btn !font-medium"
                                    disabled={!dirty}
                                    onclickfunc={() => {
                                        setName(user?.name ?? '');
                                        setEmail(user?.email ?? '');
                                        setErrors({});
                                    }}
                                >
                                    Discard
                                </SpkButton>
                                <SpkButton
                                    buttontype="submit"
                                    disabled={saving || !dirty}
                                    customClass="ti-btn !bg-primary !text-white !font-medium disabled:opacity-60"
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </SpkButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default Profile;
