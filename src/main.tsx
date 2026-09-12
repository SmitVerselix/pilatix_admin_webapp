import React, { lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store.tsx';
import RootWrapper from './pages/Rootwrapper.tsx';
import { AuthProvider } from './auth/auth-context.tsx';
import { RequireAuth, RequireGuest } from './auth/protected-route.tsx';
import '../src/assets/scss/tailwind/_tailwind.scss';
import './index.scss';

const App = lazy(() => import('./pages/App.tsx'));
const Authenticationlayout = lazy(() => import('./pages/authenticationlayout.tsx'));
const Loader = lazy(() => import('./components/common/loader/loader.tsx'));

const Dashboard = lazy(() => import('./container/dashboards/dashboard.tsx'));
const Roles = lazy(() => import('./container/roles/roles.tsx'));
const Users = lazy(() => import('./container/users/users.tsx'));
const AddUser = lazy(() => import('./container/users/add-user.tsx'));
const UserDetail = lazy(() => import('./container/users/user-detail.tsx'));
const LoginHistory = lazy(() => import('./container/login-history/login-history.tsx'));
const FileUpload = lazy(() => import('./container/uploads/file-upload.tsx'));
const Profile = lazy(() => import('./container/profile/profile.tsx'));
const SignIn = lazy(() => import('./container/authentication/sign-in/sign-in.tsx'));
const Error401 = lazy(() => import('./container/error/error-401/error-401.tsx'));
const Error404 = lazy(() => import('./container/error/error-404/error-404.tsx'));
const Error500 = lazy(() => import('./container/error/error-500/error-500.tsx'));

const BASE = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.Fragment>
        <Provider store={store}>
            <RootWrapper>
                <BrowserRouter>
                    <AuthProvider>
                        <React.Suspense fallback={<Loader />}>
                            <Routes>
                                {/* Authenticated shell */}
                                <Route element={<RequireAuth />}>
                                    <Route path={BASE} element={<App />}>
                                        <Route index element={<Navigate to={`${BASE}dashboard`} replace />} />
                                        <Route path={`${BASE}dashboard`} element={<Dashboard />} />
                                        <Route path={`${BASE}roles`} element={<Roles />} />
                                        <Route path={`${BASE}users`} element={<Users />} />
                                        <Route path={`${BASE}users/add`} element={<AddUser />} />
                                        <Route path={`${BASE}users/:userId`} element={<UserDetail />} />
                                        <Route path={`${BASE}login-history`} element={<LoginHistory />} />
                                        <Route path={`${BASE}uploads`} element={<FileUpload />} />
                                        <Route path={`${BASE}profile`} element={<Profile />} />
                                    </Route>
                                </Route>

                                {/* Public / error pages */}
                                <Route element={<Authenticationlayout />}>
                                    <Route element={<RequireGuest />}>
                                        <Route path={`${BASE}authentication/sign-in`} element={<SignIn />} />
                                    </Route>
                                    <Route path={`${BASE}error/error-401`} element={<Error401 />} />
                                    <Route path={`${BASE}error/error-404`} element={<Error404 />} />
                                    <Route path={`${BASE}error/error-500`} element={<Error500 />} />
                                    <Route path="*" element={<Error404 />} />
                                </Route>
                            </Routes>
                        </React.Suspense>

                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: { fontSize: '0.8125rem' },
                                success: { iconTheme: { primary: 'rgb(38, 191, 148)', secondary: '#fff' } },
                                error: { iconTheme: { primary: 'rgb(230, 83, 60)', secondary: '#fff' } },
                            }}
                        />
                    </AuthProvider>
                </BrowserRouter>
            </RootWrapper>
        </Provider>
    </React.Fragment>,
);
