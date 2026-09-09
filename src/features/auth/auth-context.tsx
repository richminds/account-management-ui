import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { TOKEN_KEY, USER_KEY } from "@/lib/api-client";
import { AuthApi } from "./auth-api";
import type { AuthUser, SignInRequest } from "./auth-types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (payload: SignInRequest) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  // Only true while a stored session is being re-validated on mount —
  // signIn() shows its own inline pending state instead.
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    // Re-validate a cached session against the server once on mount (catches a
    // token revoked or a user deleted since the last visit) without blocking
    // the UI — the optimistic cached user renders instantly.
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    AuthApi.me()
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (payload: SignInRequest) => {
    const res = await AuthApi.signIn(payload);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AuthApi.signOut();
    } finally {
      // Clear locally even if the revoke call fails — the client is
      // discarding the token either way.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  return <AuthContext value={{ user, loading, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  // React 19's `use()` reads context and throws for a missing provider on its
  // own terms; the explicit check keeps the error message useful.
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
