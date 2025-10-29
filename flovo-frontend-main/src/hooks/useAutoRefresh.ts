import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshOptions {
  interval?: number; // Refresh interval in milliseconds (default: 30000 = 30s)
  enabled?: boolean; // Enable/disable auto-refresh (default: true)
  onError?: (error: any) => void; // Error callback
}

/**
 * Custom hook for auto-refreshing data
 * @param fetchFunction - Async function that fetches data
 * @param options - Configuration options
 * @returns {data, loading, error, refresh, setData}
 */
export function useAutoRefresh<T>(
  fetchFunction: () => Promise<T>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    interval = 30000, // Default 30 seconds
    enabled = true,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const isInitialFetchRef = useRef<boolean>(true);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      // Only show loading spinner on initial fetch, not on auto-refresh
      if (isInitialFetchRef.current) {
        setLoading(true);
      }
      setError(null);
      const result = await fetchFunction();

      if (mountedRef.current) {
        setData(result);
        setLoading(false);
        isInitialFetchRef.current = false; // Mark initial fetch as complete
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        if (onError) {
          onError(err);
        }
      }
    }
  }, [fetchFunction, onError]);

  // Manual refresh function (shows loading spinner)
  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchData();

    // Set up interval if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, enabled, interval]);

  return {
    data,
    loading,
    error,
    refresh,
    setData, // Allow manual data updates
  };
}

/**
 * Hook for fetching data once without auto-refresh
 */
export function useFetch<T>(fetchFunction: () => Promise<T>) {
  return useAutoRefresh<T>(fetchFunction, { enabled: false, interval: 0 });
}
