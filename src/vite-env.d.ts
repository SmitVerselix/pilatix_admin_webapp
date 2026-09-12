/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API origin only (scheme://host:port). The version is in endpoints.ts. */
    readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
