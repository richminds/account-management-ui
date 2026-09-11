import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AuthApi } from "./auth-api";
import { AuthAlert, AuthCard, AuthLayout, AuthLink, Field } from "./AuthShell";

/**
 * Request a reset link.
 *
 * The confirmation deliberately does NOT say whether the address was found.
 * auth-service answers every request with the same generic message so the
 * endpoint can't be used to discover which addresses are registered, and a UI
 * that said "we couldn't find that email" would hand back exactly the
 * information the endpoint withholds.
 */
export function ForgotPasswordScreen({
  onBack,
  onHasToken,
}: {
  onBack: () => void;
  onHasToken: (token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await AuthApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      // Present only when auth-service has no mailer configured and the
      // operator opted in (AUTH_EXPOSE_RESET_TOKEN). Shown rather than
      // swallowed so the flow is completable in local development.
      setDebugToken(res.debug_token ?? null);
    } catch (err) {
      const message = apiErrorMessage(
        err,
        "Something went wrong — check the auth service is reachable.",
      );
      setError(message);
      toast.error("Couldn't send the reset link", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Forgot Password?"
        subtitle="Enter your email and we'll send you a link to choose a new password."
      >
        {sent ? (
          <div className="space-y-4">
            <AuthAlert tone="success">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. Check
              your inbox, and your spam folder.
            </AuthAlert>

            {debugToken && (
              <div className="rounded-lg border border-brand-amber/25 bg-brand-amber/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-amber">
                  Development mode
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  No mail server is configured, so the token is shown here instead of emailed.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2.5 h-9 w-full text-xs"
                  onClick={() => onHasToken(debugToken)}
                >
                  Continue to reset
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AuthAlert>{error}</AuthAlert>}

            <Field
              icon={Mail}
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
              autoFocus
            />

            <Button
              type="submit"
              className="h-11 w-full text-sm"
              disabled={submitting || !email.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="pt-1 text-center">
              <AuthLink onClick={onBack}>Back to sign in</AuthLink>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
