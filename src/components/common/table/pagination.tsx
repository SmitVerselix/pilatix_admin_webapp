import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Select from '../form/select';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

const LIMITS = [10, 25, 50, 100];

/** Windowed page numbers so long result sets stay readable. */
function pageWindow(page: number, totalPages: number) {
    const span = 5;
    let start = Math.max(1, page - Math.floor(span / 2));
    const end = Math.min(totalPages, start + span - 1);
    start = Math.max(1, end - span + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const Pagination = ({ page, totalPages, total, limit, onPageChange, onLimitChange }: PaginationProps) => {
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return (
        <Fragment>
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[0.813rem] text-[#8c9097] dark:text-white/50">
                        Showing <b className="text-defaulttextcolor dark:text-defaulttextcolor/70">{from}</b> to{' '}
                        <b className="text-defaulttextcolor dark:text-defaulttextcolor/70">{to}</b> of{' '}
                        <b className="text-defaulttextcolor dark:text-defaulttextcolor/70">{total}</b> entries
                    </span>
                    {onLimitChange && (
                        <Select
                            className="w-[7.5rem] shrink-0"
                            ariaLabel="Rows per page"
                            value={String(limit)}
                            onChange={(next) => onLimitChange(Number(next))}
                            options={LIMITS.map((value) => ({ value: String(value), label: `${value} / page` }))}
                        />
                    )}
                </div>

                <nav aria-label="Pagination">
                    <ul className="ti-pagination mb-0">
                        <li className={page <= 1 ? 'disabled' : ''}>
                            <Link
                                className="page-link !py-[0.375rem] !px-[0.75rem] !text-[0.8rem]"
                                to="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (page > 1) onPageChange(page - 1);
                                }}
                            >
                                Prev
                            </Link>
                        </li>
                        {pageWindow(page, Math.max(totalPages, 1)).map((value) => (
                            <li key={value} className={value === page ? 'active' : ''}>
                                <Link
                                    className="page-link !py-[0.375rem] !px-[0.75rem] !text-[0.8rem]"
                                    to="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onPageChange(value);
                                    }}
                                >
                                    {value}
                                </Link>
                            </li>
                        ))}
                        <li className={page >= totalPages ? 'disabled' : ''}>
                            <Link
                                className="page-link !py-[0.375rem] !px-[0.75rem] !text-[0.8rem]"
                                to="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (page < totalPages) onPageChange(page + 1);
                                }}
                            >
                                Next
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </Fragment>
    );
};

export default Pagination;
