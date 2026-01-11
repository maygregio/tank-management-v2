import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates common queries that need refreshing after data mutations.
 * Use this after creating, updating, or deleting movements, tanks, or adjustments.
 */
export function invalidateCommonQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['movements'] });
  queryClient.invalidateQueries({ queryKey: ['tanks'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['alerts'] });
}
