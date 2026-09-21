import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shared hosting: keep data longer so SignalR soft-updates don't thrash the API.
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const msg = ((error as Error)?.message || '').toLowerCase();
        if (msg.includes('timeout') || msg.includes('مهلة') || msg.includes('network')) return false;
        return failureCount < 1;
      },
      networkMode: 'online',
    },
  },
});
