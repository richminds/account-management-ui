import axios from "axios";

// Single axios instance for auth-service. Leave VITE_AUTH_BASE_URL unset in
// local dev and vite.config.ts's proxy forwards /auth/* to localhost:8100.
const baseURL = import.meta.env.VITE_AUTH_BASE_URL || "";

export const TOKEN_KEY = "account-management.auth_token";
export const USER_KEY = "account-management.auth_user";

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid/revoked token) drop the stored session and let the
// auth provider react. Broadcast rather than import the provider here, to
// avoid an import cycle.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isLoginAttempt = url.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

/** auth-service returns `{ error: { code, message, request_id } }` on failure. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: { message?: string } } } };
  return e.response?.data?.error?.message ?? fallback;
}
