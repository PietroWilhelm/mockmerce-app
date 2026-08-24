import { ApiError } from "@/types/api";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s

      gcTime: 1000 * 60 * 5, // 5min,

      retry: (failureCount, error) => {
        if (error instanceof ApiError && error?.status >= 400 && error?.status < 500) {
          return false;
        }

        return failureCount < 2;
      }
    }
  }
})