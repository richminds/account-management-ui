import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AuthApi } from "./auth-api";
import { AuthAlert, AuthCard, AuthLayout, AuthLink, Field, PasswordToggle } from "./AuthShell";

/** Mirrors auth-service's ResetPasswordRequest.new_password minimum, which is
 *  itself RegisterRequest's — so a reset can't set a password that
 *  registration would have refused. Checked here only to fail fast; the
 *  server is the authority. */
const MIN_PASSWORD = 6;

/**
 * Redeem a token from an emailed link.
 *
 * Reached by URL, not by navigation: App.tsx renders this whenever the address
 * carries a `token` query parameter, before the signed-in check — someone who
 * still has a live session may well be the person resetting the password.
 */
export function ResetPasswordScreen({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await AuthApi.resetPassword(token, password);
      setDone(true);
      toast.success("Password updated");
    } catch (err) {
      // auth-service returns 400 with a message that distinguishes unknown,
      // already-used and expired links; surface it rather than flattening
      // all three into one unhelpful string.
      const message = apiErrorMessage(err, "That reset link could not be used.");
      setError(message);
      toast.error("Reset failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Choose a New Password"
        subtitle="Set the password you'll use to sign in to this console."
      >
        {done ? (
          <div className="space-y-4">
            <AuthAlert tone="success">
              Your password has been updated. You can sign in with it now.
            </AuthAlert>
            <Button type="button" className="h-11 w-full text-sm" onClick={onDone}>
              Continue to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AuthAlert>{error}</AuthAlert>}

            <Field
              icon={Lock}
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Your new password"
              value={password}
              onChange={setPassword}
              required
              autoFocus
              hint={`At least ${MIN_PASSWORD} characters.`}
              trailing={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                />
              }
            />
            <Field
              icon={Lock}
              label="Confirm New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={setConfirm}
              required
            />

            <Button type="submit" className="h-11 w-full text-sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="pt-1 text-center">
              <AuthLink onClick={onDone}>Back to sign in</AuthLink>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
