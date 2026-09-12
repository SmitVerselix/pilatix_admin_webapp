/** Shared display formatting for backend values. */

export function formatDateTime(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Turns `external_user` into `External user` for labels. */
export function humanise(value?: string | null) {
    if (!value) return '—';
    const spaced = value.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function initials(name?: string | null, email?: string | null) {
    const source = (name || email || '?').trim();
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Very rough UA parse, only for display in the login-history table. */
export function describeUserAgent(userAgent?: string | null) {
    if (!userAgent) return '—';
    const browser =
        /Edg\//.test(userAgent) ? 'Edge'
        : /OPR\//.test(userAgent) ? 'Opera'
        : /Chrome\//.test(userAgent) ? 'Chrome'
        : /Safari\//.test(userAgent) ? 'Safari'
        : /Firefox\//.test(userAgent) ? 'Firefox'
        : null;

    const os =
        /Windows/.test(userAgent) ? 'Windows'
        : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
        : /Android/.test(userAgent) ? 'Android'
        : /iPhone|iPad|iOS/.test(userAgent) ? 'iOS'
        : /Linux/.test(userAgent) ? 'Linux'
        : null;

    if (browser && os) return `${browser} · ${os}`;
    return browser || os || userAgent.slice(0, 40);
}
