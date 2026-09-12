import { Fragment } from 'react';
import SpkButton from '../../../@spk/uielements/spk-button';

interface TableStateProps {
    colSpan: number;
    loading: boolean;
    error?: string | null;
    empty: boolean;
    emptyText?: string;
    onRetry?: () => void;
}

/**
 * Single <tr> covering the loading / error / empty states of a data table so
 * every list screen behaves the same way.
 */
const TableState = ({ colSpan, loading, error, empty, emptyText = 'No records found.', onRetry }: TableStateProps) => {
    if (loading) {
        return (
            <tr>
                <td colSpan={colSpan} className="text-center !py-8">
                    <span className="inline-flex items-center gap-2 text-[#8c9097] dark:text-white/50 text-[0.813rem]">
                        <i className="ti ti-loader animate-spin text-[1rem]"></i> Loading…
                    </span>
                </td>
            </tr>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={colSpan} className="text-center !py-8">
                    <p className="text-danger text-[0.813rem] mb-2">
                        <i className="ti ti-alert-circle me-1"></i>
                        {error}
                    </p>
                    {onRetry && (
                        <SpkButton
                            buttontype="button"
                            onclickfunc={onRetry}
                            customClass="ti-btn !text-[0.8rem] !py-[0.4rem] !px-[0.85rem] !bg-primary !text-white !font-medium"
                        >
                            Try again
                        </SpkButton>
                    )}
                </td>
            </tr>
        );
    }

    if (empty) {
        return (
            <tr>
                <td colSpan={colSpan} className="text-center !py-8">
                    <span className="text-[#8c9097] dark:text-white/50 text-[0.813rem]">
                        <i className="ti ti-database-off me-1"></i>
                        {emptyText}
                    </span>
                </td>
            </tr>
        );
    }

    return <Fragment />;
};

export default TableState;
