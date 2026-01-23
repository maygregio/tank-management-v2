import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tanksApi, movementsApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { DEFAULT_POLLING_INTERVAL_MS } from '@/lib/constants';
import type { Movement, MovementUpdate, TankWithLevel } from '@/lib/types';

interface UseTankDetailOptions {
  tankId: string;
  pollingInterval?: number;
}

interface UseTankDetailReturn {
  // Data
  tank: TankWithLevel | undefined;
  history: Movement[] | undefined;

  // Loading states
  isLoading: boolean;
  tankLoading: boolean;
  historyLoading: boolean;

  // Mutations
  deleteTank: () => void;
  updateMovement: (id: string, data: MovementUpdate) => void;
  completeMovement: (id: string, actualVolume: number) => void;

  // Mutation states
  isDeleting: boolean;
  isUpdating: boolean;
  isCompleting: boolean;
}

export function useTankDetail({
  tankId,
  pollingInterval = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL) || DEFAULT_POLLING_INTERVAL_MS,
}: UseTankDetailOptions): UseTankDetailReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // Queries
  const { data: tank, isLoading: tankLoading } = useQuery({
    queryKey: ['tank', tankId],
    queryFn: ({ signal }) => tanksApi.getById(tankId, signal),
    refetchInterval: pollingInterval,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['tank-history', tankId],
    queryFn: ({ signal }) => tanksApi.getHistory(tankId, signal),
    refetchInterval: pollingInterval,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tanksApi.delete,
    onSuccess: () => {
      success('Tank deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      router.push('/tanks');
    },
    onError: () => {
      error('Failed to delete tank');
    },
  });

  // Update movement mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MovementUpdate }) =>
      movementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['tank', tankId] });
      queryClient.invalidateQueries({ queryKey: ['tank-history', tankId] });
      success('Movement updated successfully');
    },
    onError: () => {
      error('Failed to update movement');
    },
  });

  // Complete movement mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, actual_volume }: { id: string; actual_volume: number }) =>
      movementsApi.complete(id, { actual_volume }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['tank', tankId] });
      queryClient.invalidateQueries({ queryKey: ['tank-history', tankId] });
      success('Movement completed successfully');
    },
    onError: () => {
      error('Failed to complete movement');
    },
  });

  return {
    // Data
    tank,
    history,

    // Loading states
    isLoading: tankLoading || historyLoading,
    tankLoading,
    historyLoading,

    // Mutation functions
    deleteTank: () => deleteMutation.mutate(tankId),
    updateMovement: (id, data) => updateMutation.mutate({ id, data }),
    completeMovement: (id, actualVolume) => completeMutation.mutate({ id, actual_volume: actualVolume }),

    // Mutation states
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}
