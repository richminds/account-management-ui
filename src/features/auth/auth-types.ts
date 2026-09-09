// Mirrors auth-service's Pydantic DTOs (features/schemas.py).

export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  /** The application this user belongs to. Being a member of the RichMinds
   *  admin app account is what makes someone an administrator. */
  account_id: string | null;
  org_id: string | null;
  /** True when account_id is the admin app account. Every endpoint this
   *  console calls is admin-only, so a non-admin sign-in gets a "not
   *  authorised" screen rather than an empty console. */
  is_admin: boolean;
  created_at?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  /** Echoes the account the login was routed to (auth-service's pluggable
   *  account registry); null for the default org/tenant login. */
  account_id?: string | null;
}

/** This console's own app account. Sent on every sign-in so auth-service knows
 *  which application the login is for, and can refuse a user who belongs to a
 *  different one. Must match auth-service's AUTH_ADMIN_ACCOUNT_ID. */
export const ADMIN_ACCOUNT_ID = "richminds";

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
/** Mirrors auth-service's AppType enum — the server validates against the same
 *  closed set, so an option missing here can't be smuggled in either. */
export const APP_TYPES = ["web", "mobile", "service", "admin", "other"] as const;
export type AppType = (typeof APP_TYPES)[number];

export const APP_TYPE_LABELS: Record<AppType, string> = {
  web: "Web app",
  mobile: "Mobile app",
  service: "Backend service",
  admin: "Admin console",
  other: "Other",
};

export interface AccountRecord {
  account_id: string;
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
  /** Whether a login adapter is actually wired up for this account in
   *  auth-service. Registering an application records that it exists; it does
   *  not by itself teach auth-service how to authenticate that application's
   *  users. */
  has_login_adapter: boolean;
}
