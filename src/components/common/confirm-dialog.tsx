import { Fragment } from 'react';
import SpkButton from '../../@spk/uielements/spk-button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    busy?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Destructive-action confirmation used before any DELETE call. */
const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    busy = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) => {
    if (!open) return null;

    return (
        <Fragment>
            <div className="fixed inset-0 z-[80] bg-black/50" onClick={busy ? undefined : onCancel} aria-hidden="true" />
            <div
                className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="w-full max-w-[26rem] pointer-events-auto bg-white dark:bg-bodybg rounded-md shadow-lg">
                    <div className="px-5 pt-5 pb-2 text-center">
                        <span className="avatar avatar-lg avatar-rounded bg-danger/10 text-danger mb-3 inline-flex items-center justify-center">
                            <i className="ti ti-trash text-[1.25rem]"></i>
                        </span>
                        <h6 className="font-semibold text-[0.9375rem] mb-1">{title}</h6>
                        <p className="text-[0.8125rem] text-[#8c9097] dark:text-white/50 mb-0">{message}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 px-5 pb-5 pt-4">
                        <SpkButton
                            buttontype="button"
                            onclickfunc={onCancel}
                            disabled={busy}
                            variant="light"
                            customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !font-medium"
                        >
                            Cancel
                        </SpkButton>
                        <SpkButton
                            buttontype="button"
                            onclickfunc={onConfirm}
                            disabled={busy}
                            customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-danger !text-white !font-medium disabled:opacity-60"
                        >
                            {busy ? 'Working…' : confirmLabel}
                        </SpkButton>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default ConfirmDialog;
