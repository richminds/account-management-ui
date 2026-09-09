/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of a deployed auth-service. Unset in local dev — the Vite proxy
   *  forwards /auth/* to http://localhost:8100 (see vite.config.ts). */
  readonly VITE_AUTH_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
