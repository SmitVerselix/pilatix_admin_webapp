const BASE = import.meta.env.BASE_URL;

const DashboardIcon = <i className="bx bx-home side-menu__icon"></i>;
const AccessIcon = <i className="bx bx-shield-quarter side-menu__icon"></i>;
const UsersIcon = <i className="bx bx-user side-menu__icon"></i>;
const ActivityIcon = <i className="bx bx-history side-menu__icon"></i>;
const MediaIcon = <i className="bx bx-cloud-upload side-menu__icon"></i>;
const ErrorIcon = <i className="bx bx-error side-menu__icon"></i>;

/**
 * Sidebar tree. Every link maps onto an endpoint the pilatix_backend actually
 * exposes (see src/api/endpoints.ts).
 */
export const MenuItems: any = [
    {
        menutitle: 'MAIN',
    },
    {
        icon: DashboardIcon,
        title: 'Dashboard',
        type: 'link',
        path: `${BASE}dashboard`,
        active: false,
        selected: false,
        dirchange: false,
    },
    {
        menutitle: 'ADMINISTRATION',
    },
    {
        icon: AccessIcon,
        title: 'Access control',
        type: 'sub',
        active: false,
        selected: false,
        dirchange: false,
        children: [
            {
                path: `${BASE}roles`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: 'Roles',
            },
        ],
    },
    {
        icon: UsersIcon,
        title: 'Users',
        type: 'sub',
        active: false,
        selected: false,
        dirchange: false,
        children: [
            {
                path: `${BASE}users/add`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: 'Add user',
            },
            {
                path: `${BASE}profile`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: 'My profile',
            },
        ],
    },
    {
        icon: ActivityIcon,
        title: 'Login history',
        type: 'link',
        path: `${BASE}login-history`,
        active: false,
        selected: false,
        dirchange: false,
    },
    {
        icon: MediaIcon,
        title: 'File upload',
        type: 'link',
        path: `${BASE}uploads`,
        active: false,
        selected: false,
        dirchange: false,
    },
    {
        menutitle: 'SYSTEM',
    },
    {
        icon: ErrorIcon,
        title: 'Error pages',
        type: 'sub',
        active: false,
        selected: false,
        dirchange: false,
        children: [
            {
                path: `${BASE}error/error-401`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: '401 Unauthorized',
            },
            {
                path: `${BASE}error/error-404`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: '404 Not found',
            },
            {
                path: `${BASE}error/error-500`,
                type: 'link',
                active: false,
                selected: false,
                dirchange: false,
                title: '500 Server error',
            },
        ],
    },
];
