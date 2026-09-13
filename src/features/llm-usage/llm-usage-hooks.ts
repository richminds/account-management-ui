import { useQueries, useQueryClient } from "@tanstack/react-query";
import { LlmUsageApi } from "./llm-usage-api";
import type { UsageFilters } from "./llm-usage-types";

const USAGE_KEY = ["llm-usage"] as const;

/** Every read the tab makes, keyed on the same filters so the headline
 *  numbers, each breakdown and the request list always describe the same
 *  slice — and so one Refresh invalidates all five together. */
export function useLlmUsage(filters: UsageFilters) {
  const queryClient = useQueryClient();
  const [stats, byModel, byAccount, byUser, requests] = useQueries({
    queries: [
      { queryKey: [...USAGE_KEY, "stats", filters], queryFn: () => LlmUsageApi.stats(filters) },
      { queryKey: [...USAGE_KEY, "models", filters], queryFn: () => LlmUsageApi.byModel(filters) },
      {
        queryKey: [...USAGE_KEY, "accounts", filters],
        queryFn: () => LlmUsageApi.byAccount(filters),
      },
      { queryKey: [...USAGE_KEY, "users", filters], queryFn: () => LlmUsageApi.byUser(filters) },
      {
        queryKey: [...USAGE_KEY, "requests", filters],
        queryFn: () => LlmUsageApi.requests(filters),
      },
    ],
  });

  return {
    stats,
    byModel,
    byAccount,
    byUser,
    requests,
    isFetching: [stats, byModel, byAccount, byUser, requests].some((q) => q.isFetching),
    // Loading is the FIRST fetch only; a refetch holds the previous render at
    // reduced opacity rather than swapping in skeletons (see LlmUsagePage).
    isLoading: stats.isLoading,
    error: stats.error ?? byModel.error ?? byAccount.error ?? byUser.error ?? requests.error,
    refetch: () => queryClient.invalidateQueries({ queryKey: USAGE_KEY }),
  };
}
