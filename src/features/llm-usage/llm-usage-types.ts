// Mirrors llm-gateway's admin schemas (app/models/admin_model.py), reached
// through the API gateway at /api/llm/v1/*.

/** One row per model ATTEMPT. A call that failed on the primary and was
 *  answered by a fallback is two rows — `error` on the first model,
 *  `fallback` on the second — sharing `http_request_id`. */
export type RequestStatus = "pending" | "success" | "fallback" | "error";

export interface UsageStats {
  total_requests: number;
  successes: number;
  fallbacks: number;
  errors: number;
  success_rate: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  avg_latency_ms: number;
  total_retries: number;
  /** null on the JSONL tracker, which keeps no cost column. */
  total_cost_usd: number | null;
  /** "MongoTracker" or "RequestTracker" — only the former can aggregate, so
   *  the breakdown tables are empty (not broken) on the latter. */
  tracker: string;
}

/** The accumulators every breakdown carries, whichever dimension it groups
 *  by, so one table component renders all of them. */
export interface UsageTotals {
  requests: number;
  successes: number;
  fallbacks: number;
  errors: number;
  error_rate: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_retries: number;
  avg_latency_ms: number;
  total_cost_usd: number;
}

export interface ModelUsage extends UsageTotals {
  model: string;
}

export interface AccountUsage extends UsageTotals {
  /** "" is traffic that arrived with no X-Account-ID — reported, not dropped,
   *  so the rows still add up to the headline totals. */
  account_id: string;
}

export interface UserUsage extends UsageTotals {
  /** "" is traffic that recorded no user (in-process callers, old rows). */
  user_id: string;
  /** Display labels the gateway sent with the id; may be "". */
  user_email: string;
  user_name: string;
}

export interface RequestRecord {
  request_id: string;
  caller: string;
  model: string;
  status: RequestStatus;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  retry_count: number;
  fallback_model: string;
  error_message: string;
  created_at: string;
  category: string;
  http_request_id: string;
  account_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  estimated_cost_usd: number;
}

export interface RequestList {
  records: RequestRecord[];
  count: number;
  tracker: string;
}

/** The one scope every usage read accepts (llm-gateway's `usage_filters`).
 *  Applied to the headline numbers, every breakdown and the request list at
 *  once, so the tab's numbers always agree with each other. */
export interface UsageFilters {
  account_id?: string;
  user_id?: string;
  caller?: string;
  /** ISO-8601, inclusive. */
  since?: string;
  /** ISO-8601, exclusive. */
  until?: string;
}

export const RANGE_PRESETS = ["24h", "7d", "30d", "all"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_LABELS: Record<RangePreset, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const RANGE_MS: Record<Exclude<RangePreset, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

/** `since` for a preset, computed at call time so a tab left open for an
 *  hour and refreshed asks about the right window. */
export function sinceFor(preset: RangePreset, now: Date = new Date()): string | undefined {
  if (preset === "all") return undefined;
  return new Date(now.getTime() - RANGE_MS[preset]).toISOString();
}
