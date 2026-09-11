import { useState } from "react";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { SignInScreen } from "./SignInScreen";

/**
 * The unauthenticated surface: sign in, forgot password, reset password.
 *
 * This console has no router — App.tsx picks a screen from state — so the
 * three views switch here instead. The one view that CAN'T be reached by
 * clicking is the reset screen: it arrives as an emailed link, so its token is
 * read from the query string (see `readResetToken`) and handed in as
 * `initialToken`.
 */
type View = "signin" | "forgot";

/** The `token` query parameter from an emailed reset link, if present. */
export function readResetToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get("token");
  return token && token.trim() ? token : null;
}

/** Drop the token from the address bar.
 *
 * Called once the token has been redeemed or abandoned, so that reloading
 * doesn't reopen the reset screen holding a token the server has now marked
 * used — which would greet the user with "this link has already been used"
 * for a reset that actually succeeded. replaceState rather than pushState so
 * Back doesn't walk into the same state. */
function clearResetToken() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function AuthScreen({ initialToken = null }: { initialToken?: string | null }) {
  const [view, setView] = useState<View>("signin");
  const [token, setToken] = useState<string | null>(initialToken);

  if (token) {
    return (
      <ResetPasswordScreen
        token={token}
        onDone={() => {
          clearResetToken();
          setToken(null);
          setView("signin");
        }}
      />
    );
  }

  if (view === "forgot") {
    return (
      <ForgotPasswordScreen
        onBack={() => setView("signin")}
        // Development path: with no mail server, auth-service hands the raw
        // token straight back and the user goes to the reset form without
        // leaving the page.
        onHasToken={(t) => setToken(t)}
      />
    );
  }

  return <SignInScreen onForgotPassword={() => setView("forgot")} />;
}
