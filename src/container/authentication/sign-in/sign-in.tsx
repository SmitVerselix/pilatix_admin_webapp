import { FC, Fragment, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import desktoplogo from '../../../assets/images/brand-logos/desktop-logo.png';
import desktopdarklogo from '../../../assets/images/brand-logos/desktop-dark.png';
import SpkButton from '../../../@spk/uielements/spk-button';
import { ApiError } from '../../../api/client';
import { useAuth } from '../../../auth/use-auth';

interface LocationState {
    from?: string;
}

const SignIn: FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!email.trim() || !password) {
            setError('Enter both your email and password.');
            return;
        }

        setSubmitting(true);
        try {
            await login(email.trim(), password);
            const from = (location.state as LocationState | null)?.from;
            navigate(from || `${import.meta.env.BASE_URL}dashboard`, { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Fragment>
            <div className="container">
                <div className="flex justify-center authentication authentication-basic items-center h-full text-defaultsize text-defaulttextcolor">
                    <div className="grid grid-cols-12">
                        <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
                        <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6 sm:col-span-8 col-span-12">
                            <div className="my-[2.5rem] flex justify-center">
                                <Link to={`${import.meta.env.BASE_URL}dashboard`}>
                                    {/* The sidebar forces h-8 on its logos; this page does not, so size it here. */}
                                    <img src={desktoplogo} alt="Pilatix" className="desktop-logo h-10" />
                                    <img src={desktopdarklogo} alt="Pilatix" className="desktop-dark h-10" />
                                </Link>
                            </div>
                            <div className="box">
                                <div className="box-body !p-[3rem]">
                                    <p className="h5 font-semibold mb-2 text-center">Sign In</p>
                                    <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                                        Sign in to the Pilatix admin panel
                                    </p>

                                    {error && (
                                        <div
                                            className="bg-danger/10 text-danger text-[0.8125rem] rounded-md px-4 py-3 mb-4"
                                            role="alert"
                                        >
                                            <i className="ti ti-alert-circle me-1 align-middle"></i>
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} noValidate>
                                        <div className="grid grid-cols-12 gap-y-4">
                                            <div className="xl:col-span-12 col-span-12">
                                                <label htmlFor="signin-email" className="form-label text-default">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control form-control-lg w-full !rounded-md"
                                                    id="signin-email"
                                                    autoComplete="username"
                                                    placeholder="admin@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                            <div className="xl:col-span-12 col-span-12 mb-2">
                                                <label htmlFor="signin-password" className="form-label text-default block">
                                                    Password
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="form-control form-control-lg !border-s !rounded-s-md"
                                                        id="signin-password"
                                                        autoComplete="current-password"
                                                        placeholder="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                    <SpkButton
                                                        onclickfunc={() => setShowPassword(!showPassword)}
                                                        Label="Toggle password visibility"
                                                        variant="light"
                                                        customClass="ti-btn !rounded-s-none !mb-0"
                                                        buttontype="button"
                                                    >
                                                        <i
                                                            className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} align-middle`}
                                                        ></i>
                                                    </SpkButton>
                                                </div>
                                            </div>
                                            <div className="xl:col-span-12 col-span-12 grid mt-2">
                                                <SpkButton
                                                    buttontype="submit"
                                                    disabled={submitting}
                                                    customClass="ti-btn ti-btn-primary !bg-primary !text-white !font-medium disabled:opacity-60"
                                                >
                                                    {submitting ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <i className="ti ti-loader animate-spin"></i> Signing in…
                                                        </span>
                                                    ) : (
                                                        'Sign In'
                                                    )}
                                                </SpkButton>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default SignIn;
