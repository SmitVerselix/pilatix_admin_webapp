/**
 * Browser-side persistence for the session. The backend tracks a device per
 * login (models/user.device.model.ts) and `logout` needs the same deviceId back,
 * so the generated web deviceId is persisted alongside the token.
 */

/**
 * The backend echoes `passwordHash` on login and profile reads. Drop it (and
 * anything else sensitive) before the user object is written anywhere.
 */
export function sanitiseUser<T extends Record<string, unknown>>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safe } = user as T & { passwordHash?: unknown };
    return safe as Omit<T, 'passwordHash'>;
}

const TOKEN_KEY = 'pilatix.admin.token';
const USER_KEY = 'pilatix.admin.user';
const DEVICE_KEY = 'pilatix.admin.deviceId';

function read(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* storage blocked - session stays in memory only */
    }
}

function remove(key: string) {
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

export const storage = {
    getToken: () => read(TOKEN_KEY),
    setToken: (token: string) => write(TOKEN_KEY, token),

    getUser: <T>(): T | null => {
        const raw = read(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },
    setUser: (user: Record<string, unknown>) => write(USER_KEY, JSON.stringify(sanitiseUser(user))),

    /** Stable per-browser device id; the backend falls back to a uuid otherwise. */
    getDeviceId: () => {
        let id = read(DEVICE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            write(DEVICE_KEY, id);
        }
        return id;
    },

    clearSession: () => {
        remove(TOKEN_KEY);
        remove(USER_KEY);
    },
};

export default storage;
