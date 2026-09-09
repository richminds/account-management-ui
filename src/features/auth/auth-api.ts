import { api } from "@/lib/api-client";
import { ADMIN_ACCOUNT_ID } from "./auth-types";
import type { AuthUser, SignInRequest, TokenResponse } from "./auth-types";

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
};
