import { useAutoRefresh } from "./useAutoRefresh";
import { employeeAPI } from "../services/apiService";

/**
 * Hook to fetch and auto-refresh all employees
 */
export function useEmployees(autoRefresh = true) {
  return useAutoRefresh(
    () => employeeAPI.getAll(),
    {
      enabled: autoRefresh,
      interval: 30000, // Refresh every 30 seconds
    }
  );
}

/**
 * Hook to fetch department statistics with auto-refresh
 */
export function useDepartmentStats(autoRefresh = true) {
  return useAutoRefresh(
    () => employeeAPI.getDepartmentStats(),
    {
      enabled: autoRefresh,
      interval: 60000, // Refresh every 60 seconds
    }
  );
}
