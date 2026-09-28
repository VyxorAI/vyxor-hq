import { MutationCache, QueryClient } from '@tanstack/react-query';

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    // The database logs stage/status changes itself, so any save may add activity
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  }),
});
