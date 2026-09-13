import { api } from "@/lib/api-client";
import type {
  AccountUsage,
  ModelUsage,
  RequestList,
  UsageFilters,
  UsageStats,
  UserUsage,
} from "./llm-usage-types";

// llm-gateway's read-only admin endpoints, THROUGH the API gateway — the same
// axios instance and bearer token as /auth/*. The gateway routes /api/llm to
// llm-gateway and swaps the token for the X-User-ID / X-Is-Admin headers that
// service trusts; called directly, llm-gateway would answer 401. Every route
// here requires the admin role (llm-gateway's require_admin), which this
// console's users have by definition.
const BASE = "/api/llm/v1";

// axios drops `undefined` params, so an unset filter simply isn't sent — and
// "" IS sent, which is what llm-gateway reads as "rows that recorded no
// account/user" rather than "no filter". Keep that distinction intact.
function params(filters: UsageFilters, extra: Record<string, unknown> = {}) {
  return { ...filters, ...extra };
}

export const LlmUsageApi = {
  stats: (filters: UsageFilters) =>
    api.get<UsageStats>(`${BASE}/stats`, { params: params(filters) }).then((r) => r.data),

  byModel: (filters: UsageFilters) =>
    api
      .get<ModelUsage[]>(`${BASE}/stats/models`, { params: params(filters) })
      .then((r) => r.data),

  byAccount: (filters: UsageFilters) =>
    api
      .get<AccountUsage[]>(`${BASE}/stats/accounts`, { params: params(filters) })
      .then((r) => r.data),

  byUser: (filters: UsageFilters) =>
    api
      .get<UserUsage[]>(`${BASE}/stats/users`, { params: params(filters) })
      .then((r) => r.data),

  requests: (filters: UsageFilters, limit = 50) =>
    api
      .get<RequestList>(`${BASE}/requests`, { params: params(filters, { limit }) })
      .then((r) => r.data),
};
