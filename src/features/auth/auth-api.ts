import { api } from "@/lib/api-client";
import { ADMIN_ACCOUNT_ID } from "./auth-types";
import type {
  AuthUser,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  SignInRequest,
  TokenResponse,
} from "./auth-types";

export const AuthApi = {
  /** Always names this console's own app account, so auth-service can verify
   *  the user actually belongs to it rather than just letting any valid
   *  credentials through whichever login form they were typed into. */
  signIn: (payload: SignInRequest) =>
    api
      .post<TokenResponse>("/auth/login", { account_id: ADMIN_ACCOUNT_ID, ...payload })
      .then((r) => r.data),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
  signOut: () => api.post<void>("/auth/logout").then(() => undefined),

  /** Request a reset link. Scoped to this console's account for the same
   *  reason signIn is — see ForgotPasswordRequest. Always resolves with the
   *  same generic message, so the caller must NOT treat success as proof the
   *  address exists. */
  forgotPassword: (email: string) =>
    api
      .post<ForgotPasswordResponse>("/auth/forgot-password", {
        email,
        account_id: ADMIN_ACCOUNT_ID,
      })
      .then((r) => r.data),

  /** Redeem a token from an emailed link. 400 if it is unknown, already used,
   *  or expired; the message says which. */
  resetPassword: (token: string, newPassword: string) =>
    api
      .post<ResetPasswordResponse>("/auth/reset-password", {
        token,
        new_password: newPassword,
      })
      .then((r) => r.data),
};
