import { useAutoRefresh } from "./useAutoRefresh";
import { taskAPI } from "../services/apiService";

/**
 * Hook to fetch all tasks (CEO view) with auto-refresh
 */
export function useAllTasks(autoRefresh = true) {
  return useAutoRefresh(
    () => taskAPI.getAll(),
    {
      enabled: autoRefresh,
      interval: 20000, // Refresh every 20 seconds
    }
  );
}

/**
 * Hook to fetch my tasks (Employee view) with auto-refresh
 */
export function useMyTasks(autoRefresh = true) {
  return useAutoRefresh(
    () => taskAPI.getMyTasks(),
    {
      enabled: autoRefresh,
      interval: 20000, // Refresh every 20 seconds
    }
  );
}
