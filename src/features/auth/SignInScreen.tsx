import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";

// Layout ported from the makemerich frontend's Login.js (gradient hero,
// floating circles, split marketing panel with glass cards, elevated form
// card) — rebuilt in Tailwind, pointed at auth-service.
//
// Sign-in only: this console administers accounts, it does not create the
// staff users who administer them. Platform staff are defined by
// auth-service's AUTH_PORTLESS_EMAILS allowlist, and sign up through the
// product they already use.
const FEATURES = [
  {
    icon: Building2,
    title: "Account Directory",
    body: "Every account users can sign in under, in one place",
  },
  {
    icon: KeyRound,
    title: "Create & Rename",
    body: "Mint a new account ID or correct a name without a deploy",
  },
  {
    icon: ShieldCheck,
    title: "Guarded Deletes",
    body: "Accounts with members, and reserved system accounts, can't be removed",
  },
];

export function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signIn({ email: email.trim().toLowerCase(), password });
      toast.success(`Signed in as ${user.name || user.email}`);
    } catch (err) {
      const message = apiErrorMessage(
        err,
        "Something went wrong — check the auth service is reachable.",
      );
      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[linear-gradient(135deg,#312e81_0%,#6366f1_55%,#8b5cf6_100%)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 animate-float" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/5 animate-float-reverse" />

      <div className="relative mx-auto grid min-h-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2">
        {/* Marketing panel — desktop only */}
        <div className="hidden text-white animate-fade-in-slow lg:block lg:pr-6">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/95 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
            <Users className="h-11 w-11 text-brand-indigo" />
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight">
            Administer Every
            <span className="block text-[#c4b5fd]">Account</span>
          </h1>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-white/90">
            The accounts users sign in under across every application — created, renamed and
            retired from one console.
          </p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
              >
                <div className="mb-1 flex items-center gap-2.5">
                  <Icon className="h-5 w-5 shrink-0 text-brand-teal" />
                  <span className="text-base font-semibold text-white">{title}</span>
                </div>
                <p className="text-sm text-white/80">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-in card */}
        <div className="mx-auto w-full max-w-[500px] animate-slide-up">
          <div className="rounded-3xl border border-white/20 bg-card/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet to-brand-indigo shadow-[0_16px_40px_rgba(99,102,241,0.45)]">
                <Users className="h-9 w-9 text-white" />
              </div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Account Management
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight">Welcome Back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to administer accounts
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-brand-red/25 bg-brand-red/10 px-3 py-2.5 text-[13px] text-brand-red">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                icon={Mail}
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                icon={Lock}
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={setPassword}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Button type="submit" className="h-11 w-full text-sm" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Access is limited to platform staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  trailing,
  className,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label className="mb-1.5 block pl-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full rounded-lg border border-border bg-background pl-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            trailing ? "pr-10" : "pr-3",
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
}
