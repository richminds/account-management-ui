import { useState } from "react";
import { toast } from "sonner";
import { Building2, KeyRound, Loader2, Lock, Mail, ShieldCheck, Users } from "lucide-react";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";
import { AuthAlert, AuthCard, AuthLayout, AuthLink, Field, PasswordToggle } from "./AuthShell";

// Sign-in only: this console administers accounts, it does not create the
// admin users who administer them. Administrators are defined by membership
// of auth-service's admin app account (AUTH_ADMIN_ACCOUNT_ID), and sign up
// through the product they already use.
//
// Forgetting a password IS self-service, though — an administrator locked out
// of this console has no other way back in, since nothing else can reset it
// for them.
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

export function SignInHero() {
  return (
    <>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/95 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
        <Users className="h-11 w-11 text-brand-indigo" />
      </div>

      <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight">
        Administer Every
        <span className="block text-[#c4b5fd]">Account</span>
      </h1>
      <p className="mb-8 max-w-lg text-base leading-relaxed text-white/90">
        The accounts users sign in under across every application — created, renamed and retired
        from one console.
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
    </>
  );
}

export function SignInScreen({ onForgotPassword }: { onForgotPassword: () => void }) {
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
    <AuthLayout hero={<SignInHero />}>
      <AuthCard title="Welcome Back" subtitle="Sign in to administer accounts">
        {error && <AuthAlert>{error}</AuthAlert>}

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
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
              />
            }
          />

          <div className="flex justify-end">
            <AuthLink onClick={onForgotPassword}>Forgot password?</AuthLink>
          </div>

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
      </AuthCard>
    </AuthLayout>
  );
}
