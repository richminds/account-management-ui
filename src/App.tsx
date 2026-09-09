import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Moon, ShieldAlert, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { SignInScreen } from "@/features/auth/SignInScreen";
import { AccountsPage } from "@/features/accounts/AccountsPage";

const THEME_KEY = "account-management-theme";

function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand-violet to-brand-indigo">
          <Users className="h-5 w-5 text-white" />
        </div>
      </div>
    );
  }

  if (!user) return <SignInScreen />;

  return (
    <div className="min-h-full">
      <header className="shrink-0 border-b border-border/60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-violet to-brand-indigo">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">Account Management</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="mr-1 hidden flex-col items-end sm:flex">
              <span className="text-xs font-medium leading-tight">{user.name}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{user.email}</span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              {user.account_id ?? "—"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Toggle theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                toast.success("Signed out");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        {user.is_admin ? <AccountsPage /> : <NotAdmin />}
      </main>
    </div>
  );
}

// Every endpoint this console calls is admin-only (auth-service's
// require_admin), so a signed-in non-admin gets told why rather than an empty
// list and a wall of 403 toasts.
function NotAdmin() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-amber/15 ring-1 ring-brand-amber/25">
          <ShieldAlert className="h-5 w-5 text-brand-amber" />
        </div>
        <div>
          <p className="text-sm font-semibold">Administrators only</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your account isn't a member of the RichMinds admin application, so account
            administration is unavailable. Ask an existing administrator to add you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
