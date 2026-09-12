import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiEnvelope } from './types';
import storage from './storage';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');

export const http = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

/** Error carrying the backend's own message so screens can show it verbatim. */
export class ApiError extends Error {
    status: number;
    payload: unknown;

    constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

/** Called when the backend rejects our token, so the app can drop to the login screen. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: () => void) {
    onSessionExpired = handler;
}

http.interceptors.request.use((config) => {
    const token = storage.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/** Messages middlewares/auth.ts sends when the session is no longer usable. */
const SESSION_DEAD_MESSAGES = ['Invalid token.', 'Token required.', 'Account disabled.'];

http.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiEnvelope<unknown>>) => {
        const status = error.response?.status ?? 0;
        const body = error.response?.data;
        const message =
            body?.message ||
            (status === 0 ? 'Cannot reach the API. Is the backend running?' : error.message) ||
            'Request failed.';

        // The auth middleware answers 400 for a missing token and 401 for a bad
        // one, so match on the message rather than the code alone.
        const hadToken = Boolean(storage.getToken());
        if (hadToken && (status === 401 || status === 400) && SESSION_DEAD_MESSAGES.includes(message)) {
            storage.clearSession();
            onSessionExpired?.();
        }

        return Promise.reject(new ApiError(message, status, body?.payload));
    },
);

/** Unwraps the `{ success, status, message, payload }` envelope. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await http.request<ApiEnvelope<T>>(config);
    return response.data.payload;
}

/** Same as `request`, but keeps the envelope's `message` for success toasts. */
export async function requestWithMessage<T>(config: AxiosRequestConfig): Promise<{ payload: T; message: string }> {
    const response = await http.request<ApiEnvelope<T>>(config);
    return { payload: response.data.payload, message: response.data.message };
}

export default http;
