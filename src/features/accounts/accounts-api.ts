import { api } from "@/lib/api-client";
import type { AccountRecord, AppType } from "@/features/auth/auth-types";

// An "account" is an APPLICATION registered against auth-service — makemerich,
// the knowledge ingest console, anything onboarded later — persisted in its own
// `app_accounts` collection. Deliberately NOT /auth/organizations: an
// organization is a tenant that users belong to, which is a different concept
// stored separately (see features/app_accounts.py in auth-service).
//
// All calls are platform-staff only (403 otherwise); the UI hides itself for
// non-staff, the server enforces it.
export const AccountsApi = {
  list: () => api.get<AccountRecord[]>("/auth/accounts").then((r) => r.data),

  /** account_id is caller-supplied, never generated — it's the value the
   *  application will send at login, so it has to be one it already knows.
   *  409 if it's taken. */
  create: (payload: {
    account_id: string;
    name: string;
    description?: string;
    app_type?: AppType;
    app_url?: string;
  }) => api.post<AccountRecord>("/auth/accounts", payload).then((r) => r.data),

  /** Partial update; account_id itself is immutable. */
  update: (
    accountId: string,
    changes: {
      name?: string;
      description?: string;
      app_type?: AppType;
      app_url?: string;
      enabled?: boolean;
    },
  ) => api.patch<AccountRecord>(`/auth/accounts/${accountId}`, changes).then((r) => r.data),

  remove: (accountId: string) => api.delete(`/auth/accounts/${accountId}`).then(() => undefined),
};
