import { useMemo, useState, type ReactNode } from "react";
import { Activity, Info, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/features/accounts/accounts-hooks";
import { useLlmUsage } from "./llm-usage-hooks";
import {
  RANGE_LABELS,
  RANGE_PRESETS,
  sinceFor,
  type AccountUsage,
  type ModelUsage,
  type RangePreset,
  type RequestRecord,
  type RequestStatus,
  type UsageFilters,
  type UsageTotals,
  type UserUsage,
} from "./llm-usage-types";

// ───────────────────────────────────────────── formatting

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en");

function fmtCompact(n: number): string {
  return compact.format(n);
}

function fmtInt(n: number): string {
  return whole.format(Math.round(n));
}

function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(ratio >= 0.1 || ratio === 0 ? 0 : 1)}%`;
}

/** Per-call LLM costs are fractions of a cent; totals can be dollars. Show
 *  enough digits that a small number isn't rendered as "$0.00". */
function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

function fmtLatency(ms: number): string {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

const STATUS_VARIANT: Record<RequestStatus, "success" | "warning" | "destructive" | "outline"> = {
  success: "success",
  fallback: "warning",
  error: "destructive",
  pending: "outline",
};

// ───────────────────────────────────────────── page

/** LLM gateway usage: which model answered, how often each failed, which
 *  account and which person the calls were for, and the tokens in / out
 *  behind the cost. Read from llm-gateway's tracker through the API gateway
 *  (see llm-usage-api.ts). */
export function LlmUsagePage() {
  const [range, setRange] = useState<RangePreset>("7d");
  // "" here means "no filter" for the SELECT, and is translated to
  // undefined before the request — llm-gateway reads an EMPTY account_id
  // as "rows that named no account", a real (and different) query.
  const [accountId, setAccountId] = useState("");
  // Computed once per (range) change, not per render: `since` embeds "now",
  // and a fresh timestamp on every render would be a new query key every
  // time and refetch forever.
  const filters = useMemo<UsageFilters>(
    () => ({ since: sinceFor(range), account_id: accountId || undefined }),
    [range, accountId],
  );

  const usage = useLlmUsage(filters);
  const accounts = useAccounts();
  // The tracker stores account_id (the UUID llm-gateway received); the
  // registered application's name is what an operator recognises.
  const accountName = useMemo(() => {
    const byId = new Map((accounts.data ?? []).map((a) => [a.account_id, a.name]));
    return (id: string) => (id ? (byId.get(id) ?? id) : "");
  }, [accounts.data]);

  const stats = usage.stats.data;
  const canAggregate = stats?.tracker === "MongoTracker";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-violet/20 to-brand-teal/10 ring-1 ring-brand-violet/20">
            <Activity className="h-5 w-5 text-brand-violet" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">LLM usage</h1>
            <p className="text-xs text-muted-foreground">
              What the LLM gateway served — by model, application account and user
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => usage.refetch()}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", usage.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* One filter row, above everything it scopes: every tile and table
          below re-renders against the same slice. */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Time range"
          className="inline-flex h-8 items-center rounded-md border border-border bg-background p-0.5"
        >
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={range === preset}
              onClick={() => setRange(preset)}
              className={cn(
                "h-7 rounded px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                range === preset
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {RANGE_LABELS[preset]}
            </button>
          ))}
        </div>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          aria-label="Application account"
          className="h-8 rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
        >
          <option value="">All accounts</option>
          {(accounts.data ?? []).map((a) => (
            <option key={a.account_id} value={a.account_id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {usage.isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : usage.error ? (
        <Card>
          <CardContent className="py-4 text-sm text-brand-red">
            Could not load LLM usage — check the API gateway can reach llm-gateway, and that
            this account is an administrator there.
          </CardContent>
        </Card>
      ) : (
        // Refetch keeps the frame: the previous render stays put at reduced
        // opacity instead of collapsing into skeletons and jumping back.
        <div
          className={cn("space-y-4 transition-opacity", usage.isFetching && "opacity-60")}
          aria-busy={usage.isFetching}
        >
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile
                label="Model calls"
                value={fmtCompact(stats.total_requests)}
                hint={`${fmtInt(stats.fallbacks)} fallback · ${fmtInt(stats.errors)} failed`}
              />
              <StatTile
                label="Success rate"
                value={stats.total_requests ? fmtPct(stats.success_rate) : "—"}
                hint={stats.total_retries ? `${fmtInt(stats.total_retries)} retries` : "no retries"}
              />
              <StatTile label="Tokens in" value={fmtCompact(stats.prompt_tokens)} hint="prompt" />
              <StatTile
                label="Tokens out"
                value={fmtCompact(stats.completion_tokens)}
                hint="completion"
              />
              <StatTile
                label="Estimated cost"
                value={fmtUsd(stats.total_cost_usd)}
                hint={stats.total_cost_usd == null ? "not tracked" : "provider list price"}
              />
              <StatTile
                label="Avg latency"
                value={fmtLatency(stats.avg_latency_ms)}
                hint="per model call"
              />
            </div>
          )}

          {stats && !canAggregate && (
            <Card>
              <CardContent className="flex items-start gap-2 py-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This gateway is running the <span className="font-mono">{stats.tracker}</span>{" "}
                  (file) tracker, which only totals what the current process has served and cannot
                  group by model, account or user. Set{" "}
                  <span className="font-mono">LLM_MONGO_URI</span> on llm-gateway for the
                  breakdowns below.
                </span>
              </CardContent>
            </Card>
          )}

          {stats && stats.total_requests === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-xs text-muted-foreground">
                No LLM calls {range === "all" ? "recorded yet" : "in this window"}
                {accountId ? " for this account" : ""}.
              </CardContent>
            </Card>
          ) : (
            <>
              <Section
                title="By model"
                subtitle="One row per model attempt — a failed primary and the fallback that answered are counted separately"
              >
                <ModelTable rows={usage.byModel.data ?? []} />
              </Section>

              <Section
                title="By application account"
                subtitle="Whose behalf the calls were made on (X-Account-ID)"
              >
                <BreakdownTable
                  rows={usage.byAccount.data ?? []}
                  keyOf={(r) => r.account_id}
                  head="Account"
                  cell={(r: AccountUsage) => <AccountCell id={r.account_id} name={accountName(r.account_id)} />}
                />
              </Section>

              <Section
                title="By user"
                subtitle="Who made the calls, as authenticated by the API gateway"
              >
                <BreakdownTable
                  rows={usage.byUser.data ?? []}
                  keyOf={(r) => r.user_id}
                  head="User"
                  cell={(r: UserUsage) => (
                    <UserCell id={r.user_id} email={r.user_email} name={r.user_name} />
                  )}
                />
              </Section>

              <Section
                title="Recent calls"
                subtitle="Most recent model attempts; rows for one request share a request ID"
              >
                <RequestsTable
                  rows={usage.requests.data?.records ?? []}
                  accountName={accountName}
                />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────── pieces

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pb-3 pt-3">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pb-2 pt-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mb-2 text-[11px] text-muted-foreground">{subtitle}</p>}
        <div className="-mx-4 overflow-x-auto px-4">{children}</div>
      </CardContent>
    </Card>
  );
}

const TH = "px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const TH_NUM = cn(TH, "text-right");
const TD = "px-2 py-1.5 align-middle whitespace-nowrap";
const TD_NUM = cn(TD, "text-right tabular-nums");

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-4 text-center text-xs text-muted-foreground">
        Nothing to show.
      </td>
    </tr>
  );
}

/** The columns every breakdown shares, so a reader learns the table once. */
function TotalsHead() {
  return (
    <>
      <th className={TH_NUM}>Calls</th>
      <th className={TH_NUM}>Failed</th>
      <th className={TH_NUM}>Fallback</th>
      <th className={TH_NUM}>Tokens in</th>
      <th className={TH_NUM}>Tokens out</th>
      <th className={TH_NUM}>Avg latency</th>
      <th className={TH_NUM}>Cost</th>
    </>
  );
}

function TotalsCells({ row }: { row: UsageTotals }) {
  return (
    <>
      <td className={TD_NUM}>{fmtInt(row.requests)}</td>
      <td className={cn(TD_NUM, row.errors > 0 && "text-brand-red")}>
        {fmtInt(row.errors)}
        {row.requests > 0 && row.errors > 0 && (
          <span className="ml-1 text-[10px] text-muted-foreground">({fmtPct(row.error_rate)})</span>
        )}
      </td>
      <td className={TD_NUM}>{fmtInt(row.fallbacks)}</td>
      <td className={TD_NUM}>{fmtInt(row.prompt_tokens)}</td>
      <td className={TD_NUM}>{fmtInt(row.completion_tokens)}</td>
      <td className={TD_NUM}>{fmtLatency(row.avg_latency_ms)}</td>
      <td className={TD_NUM}>{fmtUsd(row.total_cost_usd)}</td>
    </>
  );
}

const TOTALS_COLS = 7;

/** Model rows get one extra channel: a thin bar for each model's share of
 *  calls, one hue (magnitude, not identity), so the busiest model is visible
 *  without reading the column. */
function ModelTable({ rows }: { rows: ModelUsage[] }) {
  const max = Math.max(0, ...rows.map((r) => r.requests));
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className={TH}>Model</th>
          <th className={cn(TH, "w-40")}>Share</th>
          <TotalsHead />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <EmptyRow colSpan={TOTALS_COLS + 2} />}
        {rows.map((r) => (
          <tr key={r.model} className="border-b border-border/50 last:border-0">
            <td className={cn(TD, "font-mono text-[11px]")}>{r.model}</td>
            <td className={TD}>
              <div
                className="h-1.5 w-full rounded-full bg-primary/15"
                role="img"
                aria-label={`${fmtPct(max ? r.requests / max : 0)} of the busiest model`}
              >
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${max ? (r.requests / max) * 100 : 0}%` }}
                />
              </div>
            </td>
            <TotalsCells row={r} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BreakdownTable<T extends UsageTotals>({
  rows,
  keyOf,
  head,
  cell,
}: {
  rows: T[];
  keyOf: (row: T) => string;
  head: string;
  cell: (row: T) => ReactNode;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className={TH}>{head}</th>
          <TotalsHead />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <EmptyRow colSpan={TOTALS_COLS + 1} />}
        {rows.map((r) => (
          <tr key={keyOf(r) || "∅"} className="border-b border-border/50 last:border-0">
            <td className={cn(TD, "max-w-64")}>{cell(r)}</td>
            <TotalsCells row={r} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccountCell({ id, name }: { id: string; name: string }) {
  if (!id) {
    return <span className="text-muted-foreground">No account named</span>;
  }
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{name}</span>
      {name !== id && <span className="truncate font-mono text-[10px] text-muted-foreground">{id}</span>}
    </div>
  );
}

function UserCell({ id, email, name }: { id: string; email: string; name: string }) {
  if (!id) {
    return <span className="text-muted-foreground">No user recorded</span>;
  }
  // Prefer the labels the gateway sent; fall back to the id, which is all an
  // older row (or a service principal) has. The id is always on the title so
  // it can be copied for a filter.
  const primary = name || email || id;
  const secondary = name ? email : "";
  return (
    <div className="flex min-w-0 flex-col" title={id}>
      <span className={cn("truncate font-medium", primary === id && "font-mono text-[11px]")}>
        {primary}
      </span>
      {secondary && <span className="truncate text-[10px] text-muted-foreground">{secondary}</span>}
    </div>
  );
}

function RequestsTable({
  rows,
  accountName,
}: {
  rows: RequestRecord[];
  accountName: (id: string) => string;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className={TH}>When</th>
          <th className={TH}>Model</th>
          <th className={TH}>Outcome</th>
          <th className={TH}>User</th>
          <th className={TH}>Account</th>
          <th className={TH_NUM}>In</th>
          <th className={TH_NUM}>Out</th>
          <th className={TH_NUM}>Latency</th>
          <th className={TH_NUM}>Cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <EmptyRow colSpan={9} />}
        {rows.map((r) => (
          <tr key={r.request_id} className="border-b border-border/50 last:border-0">
            <td className={TD}>
              <div className="text-muted-foreground">{formatDate(r.created_at)}</div>
              {/* The X-Request-ID: every attempt of one call shares it, so two
                  adjacent rows with the same one ARE one request. */}
              {r.http_request_id && (
                <div
                  className="font-mono text-[10px] text-muted-foreground/80"
                  title="Request ID — shared by every model attempt of one call"
                >
                  {r.http_request_id}
                </div>
              )}
            </td>
            <td className={cn(TD, "font-mono text-[11px]")}>{r.model}</td>
            <td className={TD}>
              <Badge
                variant={STATUS_VARIANT[r.status] ?? "outline"}
                className="text-[9px]"
                title={r.error_message || undefined}
              >
                {r.status}
                {r.retry_count > 0 && ` · ${r.retry_count} retr${r.retry_count === 1 ? "y" : "ies"}`}
              </Badge>
              {r.error_message && (
                <p className="mt-0.5 max-w-56 truncate text-[10px] text-muted-foreground" title={r.error_message}>
                  {r.error_message}
                </p>
              )}
            </td>
            <td className={cn(TD, "max-w-48 truncate")} title={r.user_email || r.user_id}>
              {r.user_name || r.user_email || r.user_id || (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className={cn(TD, "max-w-40 truncate")} title={r.account_id}>
              {r.account_id ? accountName(r.account_id) : <span className="text-muted-foreground">—</span>}
            </td>
            <td className={TD_NUM}>{fmtInt(r.prompt_tokens)}</td>
            <td className={TD_NUM}>{fmtInt(r.completion_tokens)}</td>
            <td className={TD_NUM}>{fmtLatency(r.latency_ms)}</td>
            <td className={TD_NUM}>{fmtUsd(r.estimated_cost_usd)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
