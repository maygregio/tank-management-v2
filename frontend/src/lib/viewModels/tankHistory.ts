import { useMemo } from 'react';
import type { Movement, TankWithLevel } from '../types';
import { formatDate } from '../dateUtils';

export interface MovementRow {
  id: string;
  dateLabel: string;
  type: 'load' | 'discharge' | 'transfer' | 'adjustment';
  status: boolean;
  movementVolume: number;
  tankAfter: number;
  notes: string | null;
}

export interface TankHistoryViewModelInput {
  tank: TankWithLevel | undefined;
  history: Movement[] | undefined;
  tankId: string;
}

export interface TankHistoryViewModel {
  sortedHistory: Movement[];
  historyTimestampMap: Map<string, number>;
  rows: MovementRow[];
  levelChartData: Array<[number, number]>;
  movementChartData: Array<[number, number]>;
  levelPercentage: number;
  levelStatusColor: string;
  levelStatusText: string;
}

/**
 * View model hook for tank history page.
 * Transforms raw movement data into UI-ready rows with running balance calculations.
 */
export function useTankHistoryViewModel({
  tank,
  history,
  tankId,
}: TankHistoryViewModelInput): TankHistoryViewModel {
  // Sort history chronologically
  const sortedHistory = useMemo(
    () =>
      history
        ? [...history].sort((a, b) => {
            const left = a.scheduled_date || a.created_at;
            const right = b.scheduled_date || b.created_at;
            return new Date(left).getTime() - new Date(right).getTime();
          })
        : [],
    [history]
  );

  // Build Map for O(1) timestamp lookups
  const historyTimestampMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of sortedHistory) {
      const timestamp = new Date(m.scheduled_date || m.created_at).getTime();
      map.set(m.id, timestamp);
    }
    return map;
  }, [sortedHistory]);

  // Calculate rows with running balance
  const rows = useMemo(() => {
    const startingLevel = tank?.initial_level || 0;

    // First pass: calculate movement volumes with correct signs
    const runningBalanceRows = sortedHistory.map((movement) => {
      const isOutgoing =
        movement.type === 'discharge' ||
        (movement.type === 'transfer' && movement.tank_id === tankId);
      const sign = isOutgoing ? -1 : 1;
      const movementVolume = Math.abs(
        movement.actual_volume ?? (movement.expected_volume || 0)
      );
      const movementDate = movement.scheduled_date || movement.created_at;

      return {
        id: movement.id,
        dateLabel: formatDate(movementDate),
        type: movement.type,
        status: movement.actual_volume === null,
        movementVolume: sign * movementVolume,
        tankAfter: 0,
        notes: movement.notes || null,
      };
    });

    // Second pass: calculate running balance
    return runningBalanceRows.reduce<MovementRow[]>((acc, row) => {
      const previousTotal = acc.length
        ? acc[acc.length - 1].tankAfter
        : startingLevel;
      const tankAfter = Math.max(previousTotal + row.movementVolume, 0);
      acc.push({ ...row, tankAfter });
      return acc;
    }, []);
  }, [sortedHistory, tank?.initial_level, tankId]);

  // Chart data for level history
  const levelChartData = useMemo(() => {
    if (!rows.length) return [];
    const data: Array<[number, number]> = [
      [new Date(tank?.created_at || 0).getTime(), tank?.initial_level || 0],
      ...rows.map((row) => {
        const timestamp = historyTimestampMap.get(row.id) || 0;
        return [timestamp, row.tankAfter] as [number, number];
      }),
    ];
    return data.sort((a, b) => a[0] - b[0]);
  }, [rows, historyTimestampMap, tank]);

  // Chart data for movement volumes
  const movementChartData = useMemo(() => {
    return rows
      .map((row) => {
        const timestamp = historyTimestampMap.get(row.id) || 0;
        return [timestamp, row.movementVolume] as [number, number];
      })
      .sort((a, b) => a[0] - b[0]);
  }, [rows, historyTimestampMap]);

  // Level status calculations
  const levelPercentage = tank?.level_percentage ?? 0;
  const levelStatusColor =
    levelPercentage < 20
      ? '#ff5252'
      : levelPercentage < 50
        ? '#ffb300'
        : '#00e676';
  const levelStatusText =
    levelPercentage < 20 ? 'LOW' : levelPercentage < 50 ? 'MEDIUM' : 'OPTIMAL';

  return {
    sortedHistory,
    historyTimestampMap,
    rows,
    levelChartData,
    movementChartData,
    levelPercentage,
    levelStatusColor,
    levelStatusText,
  };
}
