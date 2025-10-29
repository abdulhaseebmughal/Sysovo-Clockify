import { useAutoRefresh } from "./useAutoRefresh";
import { attendanceAPI } from "../services/apiService";

/**
 * Hook to fetch all attendance records with auto-refresh
 */
export function useAttendance(autoRefresh = true) {
  return useAutoRefresh(
    () => attendanceAPI.getAll(),
    {
      enabled: autoRefresh,
      interval: 60000, // Refresh every 60 seconds (1 minute)
    }
  );
}

/**
 * Hook to fetch today's attendance with auto-refresh
 */
export function useTodayAttendance(autoRefresh = true) {
  return useAutoRefresh(
    () => attendanceAPI.getToday(),
    {
      enabled: autoRefresh,
      interval: 15000, // Refresh every 15 seconds
    }
  );
}

/**
 * Hook to fetch attendance statistics with auto-refresh
 */
export function useAttendanceStats(
  params?: {
    timeRange?: "daily" | "weekly" | "monthly";
    startDate?: string;
    endDate?: string;
  },
  autoRefresh = true
) {
  return useAutoRefresh(
    () => attendanceAPI.getStats(params),
    {
      enabled: autoRefresh,
      interval: 30000, // Refresh every 30 seconds
    }
  );
}

/**
 * Hook to fetch current user's attendance session
 */
export function useCurrentSession(autoRefresh = true) {
  return useAutoRefresh(
    () => attendanceAPI.getCurrentSession(),
    {
      enabled: autoRefresh,
      interval: 10000, // Refresh every 10 seconds for active session
    }
  );
}

/**
 * Hook to fetch specific user's attendance records
 */
export function useUserAttendance(
  userId: string,
  params?: { startDate?: string; endDate?: string; limit?: number },
  autoRefresh = true
) {
  return useAutoRefresh(
    () => attendanceAPI.getUserAttendance(userId, params),
    {
      enabled: autoRefresh && !!userId,
      interval: 30000,
    }
  );
}
