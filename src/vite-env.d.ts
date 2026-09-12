/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of a deployed auth-service. Unset in local dev — the Vite proxy
   *  forwards /auth/* to http://localhost:8100 (see vite.config.ts). */
  readonly VITE_AUTH_BASE_URL?: string;
  /** The auth-service admin app account this console signs in under. REQUIRED
   *  — src/features/auth/auth-types.ts refuses to boot without it. Minted by
   *  the operator bootstrap, so it differs per deployment. */
  readonly VITE_ADMIN_ACCOUNT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
