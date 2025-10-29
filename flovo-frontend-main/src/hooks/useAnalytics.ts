import { useAutoRefresh } from "./useAutoRefresh";
import { analyticsAPI } from "../services/apiService";

/**
 * Hook to fetch employee analytics with auto-refresh
 */
export function useAnalytics(
  params?: { timeRange?: string; date?: string },
  autoRefresh = true
) {
  return useAutoRefresh(
    () => analyticsAPI.getAll(params),
    {
      enabled: autoRefresh,
      interval: 60000, // Refresh every 60 seconds (analytics don't change as frequently)
    }
  );
}
