import { Fragment } from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    /** Small line under the value, e.g. "3 of 4 defined". */
    hint?: string;
    to?: string;
    linkLabel?: string;
    loading?: boolean;
}

/** Compact KPI tile for the dashboard, built on the template's `box` styling. */
const StatCard = ({ title, value, icon, color, hint, to, linkLabel = 'View', loading = false }: StatCardProps) => (
    <Fragment>
        <div className="box overflow-hidden">
            <div className="box-body">
                <div className="flex items-start justify-between gap-3">
                    <span
                        className={`!w-[2.5rem] !h-[2.5rem] !rounded-full inline-flex items-center justify-center shrink-0 bg-${color}`}
                    >
                        <i className={`ti ti-${icon} text-[1rem] text-white`}></i>
                    </span>
                    <div className="flex-grow">
                        <p className="text-[#8c9097] dark:text-white/50 text-[0.813rem] mb-0">{title}</p>
                        <h4 className="font-semibold text-[1.5rem] !mb-1">
                            {loading ? <i className="ti ti-loader animate-spin text-[1rem]"></i> : value}
                        </h4>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[0.6875rem] text-[#8c9097] dark:text-white/50">{hint ?? ''}</span>
                            {to && (
                                <Link className={`text-${color} text-[0.75rem] whitespace-nowrap`} to={to}>
                                    {linkLabel}
                                    <i className="ti ti-arrow-narrow-right ms-1 font-semibold inline-block"></i>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Fragment>
);

export default StatCard;
