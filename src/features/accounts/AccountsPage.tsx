import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AppWindow,
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Plug,
  PlugZap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APP_TYPES,
  APP_TYPE_LABELS,
  type AccountRecord,
  type AppType,
} from "@/features/auth/auth-types";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "./accounts-hooks";

// An account here is a registered APPLICATION (auth-service's app_accounts
// collection), not a tenant. See accounts-api.ts.
export function AccountsPage() {
  const accounts = useAccounts();
  const createAccount = useCreateAccount();
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [appType, setAppType] = useState<AppType>("web");
  const [appUrl, setAppUrl] = useState("");
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return accounts.data ?? [];
    return (accounts.data ?? []).filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.account_id.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.app_url.toLowerCase().includes(q) ||
        a.app_type.toLowerCase().includes(q),
    );
  }, [accounts.data, filter]);

  const canCreate = Boolean(accountId.trim() && name.trim()) && !createAccount.isPending;

  async function handleCreate() {
    if (!canCreate) return;
    try {
      await createAccount.mutateAsync({
        account_id: accountId.trim(),
        name: name.trim(),
        description: description.trim(),
        app_type: appType,
        app_url: appUrl.trim(),
      });
      setAccountId("");
      setName("");
      setDescription("");
      setAppType("web");
      setAppUrl("");
      toast.success("Application registered");
    } catch (err) {
      toast.error("Could not register application", {
        description: apiErrorMessage(err, "Check the auth service is reachable."),
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-violet/20 to-brand-teal/10 ring-1 ring-brand-violet/20">
            <AppWindow className="h-5 w-5 text-brand-violet" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Applications</h1>
            <p className="text-xs text-muted-foreground">
              Applications registered against the auth service
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => accounts.refetch()}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", accounts.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 pb-4 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="account-id"
              className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Display name"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value as AppType)}
              aria-label="Application type"
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
            >
              {APP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {APP_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="App URL (https://…)"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Description (optional)"
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              size="sm"
              className="h-9 shrink-0 gap-1.5 text-xs"
              disabled={!canCreate}
              onClick={handleCreate}
            >
              {createAccount.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Register
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            The <span className="font-mono">account-id</span> is what the application sends when
            its users sign in — it can't be changed later.
          </p>
        </CardContent>
      </Card>

      {accounts.data && accounts.data.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, ID or description"
              className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {visible.length} of {accounts.data.length} application
            {accounts.data.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {accounts.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : accounts.isError ? (
        <Card>
          <CardContent className="py-4 text-sm text-brand-red">
            Could not load applications — check the auth service is reachable.
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            {accounts.data && accounts.data.length > 0
              ? "No applications match that filter."
              : "No applications registered yet. Register one above."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {visible.map((account) => (
            <AccountRow key={account.account_id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountRow({ account }: { account: AccountRecord }) {
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [description, setDescription] = useState(account.description);
  const [appType, setAppType] = useState<AppType>(account.app_type);
  const [appUrl, setAppUrl] = useState(account.app_url);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function cancelEdit() {
    setEditing(false);
    setName(account.name);
    setDescription(account.description);
    setAppType(account.app_type);
    setAppUrl(account.app_url);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedUrl = appUrl.trim();
    if (!trimmedName) return;
    if (
      trimmedName === account.name &&
      trimmedDescription === account.description &&
      appType === account.app_type &&
      trimmedUrl === account.app_url
    ) {
      cancelEdit();
      return;
    }
    try {
      await updateAccount.mutateAsync({
        accountId: account.account_id,
        changes: {
          name: trimmedName,
          description: trimmedDescription,
          app_type: appType,
          app_url: trimmedUrl,
        },
      });
      setEditing(false);
      toast.success("Application updated");
    } catch (err) {
      toast.error("Could not update application", {
        description: apiErrorMessage(err, "Try again."),
      });
    }
  }

  async function handleToggleEnabled() {
    try {
      await updateAccount.mutateAsync({
        accountId: account.account_id,
        changes: { enabled: !account.enabled },
      });
      toast.success(account.enabled ? "Application disabled" : "Application enabled");
    } catch (err) {
      toast.error("Could not change status", { description: apiErrorMessage(err, "Try again.") });
    }
  }

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync(account.account_id);
      toast.success("Application deregistered");
    } catch (err) {
      toast.error("Could not deregister application", {
        description: apiErrorMessage(err, "Try again."),
      });
      setConfirmingDelete(false);
    }
  }

  return (
    <Card className={cn(!account.enabled && "opacity-60")}>
      <CardContent className="flex items-center gap-3 pb-3 pt-3">
        {editing ? (
          <div className="flex flex-1 flex-col gap-2">
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEdit();
              }}
              placeholder="Display name"
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEdit();
              }}
              placeholder="Description"
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value as AppType)}
                aria-label="Application type"
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
              >
                {APP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {APP_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") cancelEdit();
                }}
                placeholder="App URL (https://…)"
                className="h-8 w-full flex-1 rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{account.name}</span>
              <Badge variant="outline" className="shrink-0 font-mono text-[9px]">
                {account.account_id}
              </Badge>
              <Badge variant="secondary" className="shrink-0 text-[9px]">
                {APP_TYPE_LABELS[account.app_type] ?? account.app_type}
              </Badge>
              {account.has_login_adapter ? (
                <Badge variant="success" className="shrink-0 gap-1 text-[9px]">
                  <PlugZap className="h-2.5 w-2.5" />
                  login wired
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 gap-1 text-[9px]">
                  <Plug className="h-2.5 w-2.5" />
                  no adapter
                </Badge>
              )}
              {!account.enabled && (
                <Badge variant="warning" className="shrink-0 text-[9px]">
                  disabled
                </Badge>
              )}
            </div>
            {account.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.description}</p>
            )}
            {account.app_url && (
              // Safe to link: the server rejects any scheme but http(s).
              <a
                href={account.app_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {account.app_url}
              </a>
            )}
            <p className="text-[10px] text-muted-foreground">
              Registered {formatDate(account.created_at)} by {account.created_by}
            </p>
          </div>
        )}

        {editing ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Save"
              disabled={updateAccount.isPending}
              onClick={handleSave}
            >
              {updateAccount.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 text-brand-teal" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Cancel"
              onClick={cancelEdit}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Deregister?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-[11px]"
              disabled={deleteAccount.isPending}
              onClick={handleDelete}
            >
              {deleteAccount.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px]"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px]"
              disabled={updateAccount.isPending}
              onClick={handleToggleEnabled}
              title={
                account.enabled
                  ? "Take this application out of service without deleting it"
                  : "Put this application back in service"
              }
            >
              {account.enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Edit"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Delete"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5 text-brand-red" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
