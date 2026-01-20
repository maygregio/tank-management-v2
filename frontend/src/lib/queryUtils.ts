import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { tanksApi, movementsApi, dashboardApi, coaApi } from './api';
import type { TankWithLevel, Movement, DashboardStats, COAWithSignal } from './types';

// ============================================================================
// Query Keys - Centralized for consistency and easy refactoring
// ============================================================================

export const queryKeys = {
  // Tanks
  tanks: {
    all: ['tanks'] as const,
    list: (location?: string) => ['tanks', { location }] as const,
    detail: (id: string) => ['tank', id] as const,
    history: (id: string) => ['tank-history', id] as const,
  },
  // Movements
  movements: {
    all: ['movements'] as const,
    list: (filters?: { tankId?: string; type?: string; status?: string }) =>
      ['movements', filters] as const,
    signals: ['signals'] as const,
  },
  // Dashboard
  dashboard: {
    stats: ['dashboard-stats'] as const,
  },
  // COA
  coa: {
    all: ['coas'] as const,
    detail: (id: string) => ['coa', id] as const,
    bySignal: (signalId: string) => ['coa', 'signal', signalId] as const,
  },
  // Alerts
  alerts: ['alerts'] as const,
} as const;

// ============================================================================
// Query Invalidation Helpers
// ============================================================================

/**
 * Invalidates common queries that need refreshing after data mutations.
 * Use this after creating, updating, or deleting movements, tanks, or adjustments.
 */
export function invalidateCommonQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.movements.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.tanks.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
}

/**
 * Invalidates tank-related queries.
 */
export function invalidateTankQueries(queryClient: QueryClient, tankId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tanks.all });
  if (tankId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.tanks.detail(tankId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tanks.history(tankId) });
  }
}

/**
 * Invalidates signal-related queries.
 */
export function invalidateSignalQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.movements.signals });
  invalidateCommonQueries(queryClient);
}

// ============================================================================
// Shared Query Hooks
// ============================================================================

// Default query options for consistency
const defaultQueryOptions = {
  staleTime: 5000, // 5 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
} as const;

type QueryOptions<TData> = Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>;

/**
 * Hook to fetch all tanks with optional location filter.
 */
export function useTanksQuery(location?: string, options?: QueryOptions<TankWithLevel[]>) {
  return useQuery({
    queryKey: location ? queryKeys.tanks.list(location) : queryKeys.tanks.all,
    queryFn: ({ signal }) => tanksApi.getAll(location, signal),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch a single tank by ID.
 */
export function useTankQuery(
  tankId: string,
  options?: QueryOptions<TankWithLevel> & { refetchInterval?: number }
) {
  return useQuery({
    queryKey: queryKeys.tanks.detail(tankId),
    queryFn: ({ signal }) => tanksApi.getById(tankId, signal),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch tank movement history.
 */
export function useTankHistoryQuery(
  tankId: string,
  options?: QueryOptions<Movement[]> & { refetchInterval?: number }
) {
  return useQuery({
    queryKey: queryKeys.tanks.history(tankId),
    queryFn: ({ signal }) => tanksApi.getHistory(tankId, signal),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch all movements with optional filters.
 */
export function useMovementsQuery(
  filters?: { tankId?: string; type?: string; status?: string },
  options?: QueryOptions<Movement[]>
) {
  return useQuery({
    queryKey: filters ? queryKeys.movements.list(filters) : queryKeys.movements.all,
    queryFn: ({ signal }) => movementsApi.getAll(filters?.tankId, filters?.type, filters?.status, signal),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch signals (movements without tank assignment or trade info).
 */
export function useSignalsQuery(options?: QueryOptions<Movement[]>) {
  return useQuery({
    queryKey: queryKeys.movements.signals,
    queryFn: ({ signal }) => movementsApi.getSignals(signal),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch dashboard statistics.
 */
export function useDashboardStatsQuery(options?: QueryOptions<DashboardStats>) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: dashboardApi.getStats,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch all COAs.
 */
export function useCOAsQuery(options?: QueryOptions<COAWithSignal[]>) {
  return useQuery({
    queryKey: queryKeys.coa.all,
    queryFn: coaApi.getAll,
    ...defaultQueryOptions,
    ...options,
  });
}
