// Mirrors auth-service's Pydantic DTOs (features/schemas.py).

/** One app account a user may sign in through. */
export interface LoginAccount {
  account_id: string;
  name: string;
  /** True on the account this session's token is scoped to. This replaced the
   *  flat `AuthUser.account_id`: `accounts` says which applications the user
   *  may use, and this says which one they are currently using. */
  selected: boolean;
}

export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  /** Every application this user may sign in through, with the active one
   *  marked. The only account information in the response — auth-service no
   *  longer repeats it as flat `account_id`/`account_ids` fields. */
  accounts: LoginAccount[];
  /** True when the scoped account is the admin app account. Every endpoint
   *  this console calls is admin-only, so a non-admin sign-in gets a "not
   *  authorised" screen rather than an empty console. */
  is_admin: boolean;
  created_at?: string | null;
}

/** The account a session is scoped to — the entry auth-service marked. */
export function selectedAccount(user: AuthUser): LoginAccount | undefined {
  return user.accounts?.find((a) => a.selected);
}

// Account membership lives on `user` and nowhere else — auth-service used to
// repeat it at this level too, which meant two copies that could disagree.
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

/** This console's own app account. Sent on every sign-in so auth-service knows
 *  which application the login is for, and can refuse a user who belongs to a
 *  different one.
 *
 *  CONFIGURED, NOT COMPILED IN. The value lives in this console's .env and
 *  nowhere else — auth-service itself has no setting for it. What makes an
 *  account the admin one there is its record's app_type ("admin"), so the
 *  service never needs to be told the ID; only this console does, because it
 *  has to name the account from a login form with no session. The ID is
 *  MINTED by the operator's bootstrap step (auth-service README,
 *  "Administration"), so it differs per deployment and no built-in default
 *  could be right. Vite inlines it at BUILD time: changing it means
 *  restarting the dev server or redeploying.
 *
 *  Refuses to boot unconfigured rather than degrade quietly. A missing value
 *  would not fail — /auth/login without an account_id still signs the user in
 *  as whichever of their records verifies first — so every sign-in here would
 *  quietly land in the wrong application and then 403 on the first admin
 *  call. A blank screen in front of whoever deployed it is the better outcome. */
const configuredAdminAccountId: string = (import.meta.env.VITE_ADMIN_ACCOUNT_ID ?? "").trim();
if (!configuredAdminAccountId) {
  throw new Error(
    "VITE_ADMIN_ACCOUNT_ID is not set. It names the auth-service admin app account this " +
      "console signs in under; set it in .env (copy .env.example) to the account_id the " +
      "operator bootstrap printed.",
  );
}
export const ADMIN_ACCOUNT_ID: string = configuredAdminAccountId;

export interface SignInRequest {
  email: string;
  password: string;
  /** Which application this login is for. Always set by this console. */
  account_id?: string;
}

/** An app account: an APPLICATION registered against auth-service, stored in
 *  its own `app_accounts` collection. Not an organization — that's a tenant
 *  users belong to, and it lives in a different collection entirely. The
 *  `account_id` here is the value the application sends as
 *  `LoginRequest.account_id` when its users sign in. */
/** Mirrors auth-service's AppType enum — every value a RECORD can carry. The
 *  server validates against the same closed set, so an option missing here
 *  can't be smuggled in either. */
export const APP_TYPES = ["web", "mobile", "service", "admin", "other"] as const;
export type AppType = (typeof APP_TYPES)[number];

/** The subset an administrator may ASSIGN. "admin" is left out on purpose: an
 *  admin-type account is what makes its members administrators, so
 *  auth-service refuses it on create and update (422) and refuses to change
 *  the admin account's type at all (403). The one admin account is created by
 *  the operator bootstrap; this console only ever displays its type. */
export const ASSIGNABLE_APP_TYPES = ["web", "mobile", "service", "other"] as const satisfies readonly AppType[];
export type AssignableAppType = (typeof ASSIGNABLE_APP_TYPES)[number];

export const APP_TYPE_LABELS: Record<AppType, string> = {
  web: "Web app",
  mobile: "Mobile app",
  service: "Backend service",
  admin: "Admin console",
  other: "Other",
};

export interface AccountRecord {
  /** UUID minted by auth-service — never chosen by the caller. This is the
   *  value the application sends at login, so it is what an operator copies
   *  into that application's configuration. */
  account_id: string;
  /** The slug this account used before IDs became UUIDs, for tracing a
   *  migrated record back to its old identity. Never used to sign in. */
  legacy_account_id?: string;
  name: string;
  description: string;
  app_type: AppType;
  /** Empty, or an http(s) URL — the server rejects other schemes, which is
   *  what makes it safe to render as a link. */
  app_url: string;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
}

// ───────────────────────────────────────────────────────── password reset

/** POST /auth/forgot-password.
 *
 *  `account_id` is REQUIRED by auth-service, unlike makemerich's version of
 *  this flow. Users there are keyed on (email, account_id) with a password
 *  hash per record, so the address alone doesn't say which password is being
 *  reset. This console always sends its own ADMIN_ACCOUNT_ID, so a reset
 *  started here only ever touches the caller's admin record. */
export interface ForgotPasswordRequest {
  email: string;
  account_id: string;
}

export interface ForgotPasswordResponse {
  /** Deliberately identical whether or not the email is registered — the
   *  endpoint must not be usable to enumerate addresses, so the UI shows this
   *  same confirmation either way. */
  message: string;
  /** Development only: the raw token, returned when auth-service has no SMTP
   *  configured AND AUTH_EXPOSE_RESET_TOKEN is on. Never present in
   *  production; surfaced in the UI so the flow is testable without a mail
   *  server. */
  debug_token?: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}
