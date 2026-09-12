import { Fragment, useEffect, useState } from 'react';
import SpkButton from '../../@spk/uielements/spk-button';
import { ApiError } from '../../api/client';
import { ROLE_NAMES, type Role } from '../../api/types';
import roleService from '../../services/role.service';
import { humanise } from '../../utils/format';

interface RoleModalProps {
    open: boolean;
    /** null = create, Role = edit */
    role: Role | null;
    /** Names already taken, so the create form can't offer a duplicate. */
    takenNames: string[];
    onClose: () => void;
    onSaved: (message: string) => void;
}

/**
 * Create/edit dialog for roles. The backend restricts `name` to enums.ROLE
 * (admin | user | external_user | guest), so it is rendered as a select.
 */
const RoleModal = ({ open, role, takenNames, onClose, onSaved }: RoleModalProps) => {
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setName(role?.name ?? '');
        setDescription(role?.description ?? '');
    }, [open, role]);

    if (!open) return null;

    // Offer the free enum names, plus whatever this role is already called - the
    // seeded data contains names (e.g. `superadmin`) outside the API's enum.
    const available: string[] = ROLE_NAMES.filter((value) => value === role?.name || !takenNames.includes(value));
    if (role && !available.includes(role.name)) available.unshift(role.name);

    const nameOutsideEnum = Boolean(role && !ROLE_NAMES.includes(role.name as (typeof ROLE_NAMES)[number]));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!name) {
            setError('Pick a role name.');
            return;
        }
        if (!description.trim()) {
            setError('Description is required.');
            return;
        }

        setSaving(true);
        try {
            let result;
            if (role) {
                // Send only what changed: the API validates `name` against its enum,
                // so resubmitting an out-of-enum name would be rejected.
                const body: { name?: string; description?: string } = {};
                if (name !== role.name) body.name = name;
                if (description.trim() !== role.description) body.description = description.trim();

                if (Object.keys(body).length === 0) {
                    onSaved('No changes to save.');
                    return;
                }
                result = await roleService.update(role.id, body);
            } else {
                result = await roleService.create({ name, description: description.trim() });
            }
            onSaved(result.message || (role ? 'Role updated.' : 'Role created.'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not save the role.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Fragment>
            <div className="fixed inset-0 z-[80] bg-black/50" onClick={onClose} aria-hidden="true" />
            <div
                className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
                role="dialog"
                aria-modal="true"
                aria-label={role ? 'Edit role' : 'Create role'}
            >
                <div className="ti-modal-content w-full max-w-[30rem] pointer-events-auto bg-white dark:bg-bodybg rounded-md shadow-lg">
                    <div className="ti-modal-header flex items-center justify-between px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10">
                        <h6 className="ti-modal-title font-semibold text-[0.9375rem]">
                            {role ? 'Edit role' : 'Create role'}
                        </h6>
                        <SpkButton
                            buttontype="button"
                            Label="Close"
                            onclickfunc={onClose}
                            customClass="ti-modal-close-btn !text-[1rem] opacity-60 hover:opacity-100"
                        >
                            <i className="ri-close-line"></i>
                        </SpkButton>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="ti-modal-body px-4 py-4">
                            {error && (
                                <div className="bg-danger/10 text-danger text-[0.8125rem] rounded-md px-3 py-2 mb-3" role="alert">
                                    <i className="ti ti-alert-circle me-1 align-middle"></i>
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12">
                                    <label htmlFor="role-name" className="form-label">
                                        Name
                                    </label>
                                    <select
                                        id="role-name"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    >
                                        <option value="">Select a role</option>
                                        {available.map((value) => (
                                            <option key={value} value={value}>
                                                {humanise(value)} ({value})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="block text-[0.6875rem] text-[#8c9097] dark:text-white/50 mt-1">
                                        {nameOutsideEnum
                                            ? `“${role?.name}” is not in the API's role enum, so renaming it will be rejected - edit the description instead.`
                                            : 'The API accepts only the role names declared in its enums.'}
                                    </span>
                                </div>
                                <div className="col-span-12">
                                    <label htmlFor="role-description" className="form-label">
                                        Description
                                    </label>
                                    <textarea
                                        id="role-description"
                                        className="form-control"
                                        rows={3}
                                        placeholder="What this role is allowed to do"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="ti-modal-footer flex items-center justify-end gap-2 px-4 py-3 border-t border-defaultborder dark:border-defaultborder/10">
                            <SpkButton
                                buttontype="button"
                                onclickfunc={onClose}
                                variant="light"
                                customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !font-medium"
                            >
                                Cancel
                            </SpkButton>
                            <SpkButton
                                buttontype="submit"
                                disabled={saving}
                                customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : role ? 'Save changes' : 'Create role'}
                            </SpkButton>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    );
};

export default RoleModal;
