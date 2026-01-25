import { useMemo } from 'react';
import { getLocalToday, isFutureDate } from '@/lib/dateUtils';
import type {
  Movement,
  MovementCreate,
  MovementType,
  TransferTargetCreate,
  TankWithLevel,
  MovementSummaryStats,
} from '@/lib/types';

export type MovementSource = 'manual' | 'pdf';

export interface MovementGridRowExtended {
  id: string;
  date: string;
  type: MovementType;
  tankName: string;
  expectedVolume: number;
  actualVolume: number | null;
  status: boolean;
  isFuture: boolean;
  notes: string;
  source: MovementSource;
}

interface MovementsViewModelInput {
  movements?: Movement[];
  tanks?: TankWithLevel[];
  formData: MovementCreate;
  transferTargets: TransferTargetCreate[];
  searchQuery: string;
  statusFilter: 'all' | 'pending' | 'completed';
  typeFilter: MovementType | 'all';
  sourceFilter: MovementSource | 'all';
}

export function useMovementsViewModel({
  movements,
  tanks,
  formData,
  transferTargets,
  searchQuery,
  statusFilter,
  typeFilter,
  sourceFilter,
}: MovementsViewModelInput) {
  const todayString = getLocalToday();
  const tankMap = useMemo(() => new Map(tanks?.map((tank) => [tank.id, tank]) || []), [tanks]);

  const targetTanks = useMemo(() => (
    tanks?.filter((tank) => tank.id !== formData.tank_id) || []
  ), [tanks, formData.tank_id]);

  const availableTargetTanks = useMemo(() => (
    targetTanks.filter((tank) => !transferTargets.some((target) => target.tank_id === tank.id))
  ), [targetTanks, transferTargets]);

  const totalTransferVolume = useMemo(
    () => transferTargets.reduce((sum, target) => sum + (target.volume || 0), 0),
    [transferTargets]
  );

  const remainingTransferVolume = useMemo(() => {
    const currentLevel = tankMap.get(formData.tank_id)?.current_level || 0;
    return currentLevel - totalTransferVolume;
  }, [formData.tank_id, tankMap, totalTransferVolume]);

  const summaryStats = useMemo<MovementSummaryStats>(() => {
    const total = movements?.length || 0;
    const pending = movements?.filter((movement) => movement.actual_volume === null).length || 0;
    const completed = total - pending;
    const scheduledToday = movements?.filter((movement) => {
      const dateValue = movement.scheduled_date || movement.created_at || '';
      // Compare YYYY-MM-DD strings directly - both are in local timezone
      return dateValue.slice(0, 10) === todayString;
    }).length || 0;
    return { total, pending, completed, scheduledToday };
  }, [movements, todayString]);

  const filteredMovements = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return (movements || [])
      .filter((movement) => (typeFilter === 'all' ? true : movement.type === typeFilter))
      .filter((movement) => {
        if (statusFilter === 'pending') return movement.actual_volume === null;
        if (statusFilter === 'completed') return movement.actual_volume !== null;
        return true;
      })
      .filter((movement) => {
        if (sourceFilter === 'all') return true;
        const isFromPdf = movement.source === 'pdf_import';
        return sourceFilter === 'pdf' ? isFromPdf : !isFromPdf;
      })
      .filter((movement) => {
        if (!search) return true;
        const source = movement.tank_id ? tankMap.get(movement.tank_id)?.name || '' : '';
        const target = movement.target_tank_id ? tankMap.get(movement.target_tank_id)?.name || '' : '';
        return (
          source.toLowerCase().includes(search)
          || target.toLowerCase().includes(search)
          || movement.type.toLowerCase().includes(search)
          || movement.notes?.toLowerCase().includes(search)
        );
      });
  }, [movements, statusFilter, typeFilter, sourceFilter, searchQuery, tankMap]);

  const rows = useMemo<MovementGridRowExtended[]>(() => (
    filteredMovements.map((movement) => {
      const tank = movement.tank_id ? tankMap.get(movement.tank_id) : undefined;
      const targetTank = movement.target_tank_id ? tankMap.get(movement.target_tank_id) : null;
      const isPending = movement.actual_volume === null;
      const dateValue = movement.scheduled_date || movement.created_at || '';
      // Map backend source to display source
      const displaySource: MovementSource = movement.source === 'pdf_import' ? 'pdf' : 'manual';
      return {
        id: movement.id,
        date: dateValue,
        type: movement.type,
        tankName: `${tank?.name || 'Unknown'}${targetTank ? ` → ${targetTank.name}` : ''}`,
        expectedVolume: movement.expected_volume || 0,
        actualVolume: movement.actual_volume,
        status: isPending,
        isFuture: isFutureDate(dateValue),
        notes: movement.notes || '',
        source: displaySource,
      };
    })
  ), [filteredMovements, tankMap]);

  return {
    tankMap,
    targetTanks,
    availableTargetTanks,
    totalTransferVolume,
    remainingTransferVolume,
    summaryStats,
    rows,
  };
}
