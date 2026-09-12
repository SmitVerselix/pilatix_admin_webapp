/**
 * Types mirroring the pilatix_backend (Desktop/pilatix_backend) models and
 * controller payloads. Keep these in sync with `src/models/*.model.ts` and the
 * Joi validation schemas in `src/api/v1/controllers/*` on the backend.
 */

/** Every backend response is wrapped by helpers/api.response.helper.ts */
export interface ApiEnvelope<T> {
    success: boolean;
    status: number;
    message: string;
    payload: T;
}

/** Columns shared by every model through models/base.model.ts */
export interface BaseRecord {
    id: string;
    isActive: boolean;
    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

/** constants/enums.ts -> enums.ROLE */
export const ROLE_NAMES = ['admin', 'user', 'external_user', 'guest'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export interface Role extends BaseRecord {
    name: RoleName | string;
    description: string;
}

/**
 * The API currently returns `passwordHash` on login and profile reads;
 * `sanitiseUser` in api/storage.ts strips it before anything is persisted.
 */
export interface User extends BaseRecord {
    name: string | null;
    email: string | null;
    mobile: string | null;
    roleId: string | null;
    socialProvider: string | null;
    socialProviderId: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    profileImage: string | null;
    currentDeviceId: string | null;
    role?: Role | null;
}

export interface LoginHistoryEntry extends BaseRecord {
    userId: string;
    deviceId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    /** 'login' | 'logout' as written by AuthService */
    type: string | null;
    /** 'success' | ... */
    status: string | null;
    reason: string | null;
    /** Sequelize include alias is lowercase `user`. */
    user?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface AuthPayload {
    token: string;
    user: User;
}

/** Sequelize findAndCountAll shape, returned as-is by RoleRepository.getRoles */
export interface CountRows<T> {
    count: number;
    rows: T[];
}

/** LoginHistoryService.listLoginHistory shape */
export interface Paginated<T> {
    items: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface UploadedFile {
    url: string;
    key: string;
    size: number;
    mimetype: string;
    originalname: string;
    createdAt: string;
}

export type DeviceType = 'ios' | 'android' | 'web';

export interface LoginRequest {
    email: string;
    password: string;
    deviceType: DeviceType;
    deviceId?: string;
    deviceName?: string;
    pushToken?: string;
}

export interface RegisterRequest {
    name: string;
    roleId: string;
    email: string;
    password: string;
    mobile?: string;
    deviceId?: string;
    deviceType?: DeviceType;
    pushToken?: string;
}

export interface RoleRequest {
    name: string;
    description: string;
}

export interface RoleListQuery {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
    isAll?: boolean;
    id?: string;
}

export interface ProfileUpdateRequest {
    name?: string;
    email?: string;
}
