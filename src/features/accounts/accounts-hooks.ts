import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppType } from "@/features/auth/auth-types";
import { AccountsApi } from "./accounts-api";

const ACCOUNTS_KEY = ["accounts"] as const;

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: AccountsApi.list });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      app_type?: AppType;
      app_url?: string;
    }) => AccountsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      changes,
    }: {
      accountId: string;
      changes: {
        name?: string;
        description?: string;
        app_type?: AppType;
        app_url?: string;
        enabled?: boolean;
      };
    }) => AccountsApi.update(accountId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => AccountsApi.remove(accountId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}
