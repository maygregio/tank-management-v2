'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { GridColDef, GridColumnVisibilityModel, GridPaginationModel } from '@mui/x-data-grid';
import { overviewApi, movementsApi, tanksApi } from '@/lib/api';
import { formatDate } from '@/lib/dateUtils';
import { useToast } from '@/contexts/ToastContext';
import type { MovementWithCOA, MovementUpdate } from '@/lib/types';
import type { ProfileName } from '@/lib/columnProfiles';
import { getProfileVisibilityModel, detectProfile } from '@/lib/columnProfiles';
import { saveColumnPreferences, loadColumnPreferences } from '@/lib/columnPreferences';
import StyledDataGrid from '@/components/StyledDataGrid';
import ProfileSelector from './ProfileSelector';

// Map grid field to API update field
const FIELD_MAP: Record<string, keyof MovementUpdate> = {
  notes: 'notes_manual',
  expected_volume: 'expected_volume_manual',
  scheduled_date: 'scheduled_date_manual',
  base_diff: 'base_diff_manual',
  quality_adj_diff: 'quality_adj_diff_manual',
  equipment: 'equipment_manual',
  tank_id: 'tank_id_manual',
  discharge_date: 'discharge_date_manual',
  strategy: 'strategy_manual',
  trade_number: 'trade_number_manual',
  destination: 'destination_manual',
};

export default function OverviewGrid() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  const saved = useMemo(() => loadColumnPreferences(), []);
  const [profile, setProfile] = useState<ProfileName>((saved?.profileName as ProfileName) || 'All');
  const [visibility, setVisibility] = useState<GridColumnVisibilityModel>(
    saved?.visibilityModel || getProfileVisibilityModel('All')
  );
  // Server-side pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['overview', paginationModel.page, paginationModel.pageSize],
    queryFn: ({ signal }) => overviewApi.getAll({
      skip: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
    }, signal),
  });

  const movements = movementsData?.items;
  const totalMovements = movementsData?.total ?? 0;

  const { data: tanks, isLoading: loadingTanks } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const tankMap = useMemo(() => new Map(tanks?.map(t => [t.id, t.name]) || []), [tanks]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MovementUpdate }) => movementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleProfileChange = useCallback((newProfile: ProfileName) => {
    setProfile(newProfile);
    if (newProfile !== 'Custom') {
      const model = getProfileVisibilityModel(newProfile);
      setVisibility(model);
      saveColumnPreferences({ profileName: newProfile, visibilityModel: model });
    }
  }, []);

  const handleVisibilityChange = useCallback((model: GridColumnVisibilityModel) => {
    setVisibility(model);
    const detected = detectProfile(model);
    setProfile(detected);
    saveColumnPreferences({ profileName: detected, visibilityModel: model });
  }, []);

  const processRowUpdate = useCallback(async (newRow: MovementWithCOA, oldRow: MovementWithCOA): Promise<MovementWithCOA> => {
    const field = Object.keys(FIELD_MAP).find(f => newRow[f as keyof MovementWithCOA] !== oldRow[f as keyof MovementWithCOA]);
    if (!field) return oldRow;

    try {
      await updateMutation.mutateAsync({
        id: newRow.id,
        data: { [FIELD_MAP[field]]: newRow[field as keyof MovementWithCOA] },
      });
      return newRow;
    } catch {
      return oldRow;
    }
  }, [updateMutation]);

  const columns = useMemo<GridColDef<MovementWithCOA>[]>(() => [
    { field: 'signal_id', headerName: 'Signal ID', width: 120 },
    { field: 'notes', headerName: 'Status Comments', width: 180, editable: true },
    { field: 'nomination_key', headerName: 'Nom Key', width: 130 },
    { field: 'refinery_tank_name', headerName: 'Load Tank', width: 130 },
    {
      field: 'expected_volume', headerName: 'Load Volume', width: 120, type: 'number', editable: true,
      renderCell: ({ value }) => value ? `${Number(value).toLocaleString()} bbl` : '—',
    },
    {
      field: 'scheduled_date', headerName: 'Load Date', width: 110, editable: true,
      renderCell: ({ value }) => value ? formatDate(value as string) : '—',
    },
    {
      field: 'coa_api_gravity', headerName: 'API Gravity', width: 100, type: 'number',
      renderCell: ({ value }) => value != null ? Number(value).toFixed(2) : '—',
    },
    {
      field: 'coa_sulfur_content', headerName: 'Sulfur', width: 90, type: 'number',
      renderCell: ({ value }) => value != null ? `${Number(value).toFixed(3)}%` : '—',
    },
    {
      field: 'coa_viscosity', headerName: 'Viscosity', width: 100, type: 'number',
      renderCell: ({ value }) => value != null ? Number(value).toFixed(2) : '—',
    },
    {
      field: 'coa_ash_content', headerName: 'Ash', width: 80, type: 'number',
      renderCell: ({ value }) => value != null ? `${Number(value).toFixed(3)}%` : '—',
    },
    {
      field: 'base_diff', headerName: 'Base Diff', width: 100, type: 'number', editable: true,
      renderCell: ({ value }) => value != null ? Number(value).toFixed(2) : '—',
    },
    {
      field: 'quality_adj_diff', headerName: 'Quality Adj', width: 110, type: 'number', editable: true,
      renderCell: ({ value }) => value != null ? Number(value).toFixed(2) : '—',
    },
    { field: 'equipment', headerName: 'Equipment', width: 120, editable: true },
    {
      field: 'tank_id', headerName: 'Discharge Tank', width: 140, editable: true,
      renderCell: ({ value }) => value ? tankMap.get(value as string) || value : '—',
    },
    {
      field: 'discharge_date', headerName: 'Discharge Date', width: 120, editable: true,
      renderCell: ({ value }) => value ? formatDate(value as string) : '—',
    },
    { field: 'strategy', headerName: 'Strategy', width: 90, type: 'number', editable: true },
    { field: 'trade_number', headerName: 'Trade ID', width: 110, editable: true },
    { field: 'destination', headerName: 'Destination', width: 130, editable: true },
  ], [tankMap]);

  if (loadingMovements || loadingTanks) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {totalMovements} Movements
        </Typography>
        <ProfileSelector value={profile} onChange={handleProfileChange} />
      </Box>

      <Box sx={{ height: 600 }}>
        <StyledDataGrid<MovementWithCOA>
          rows={movements || []}
          columns={columns}
          columnVisibilityModel={visibility}
          onColumnVisibilityModelChange={handleVisibilityChange}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(err) => showError(err.message)}
          // Server-side pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalMovements}
          pageSizeOptions={[25, 50, 100]}
          loading={loadingMovements}
          editMode="cell"
          variant="overview"
        />
      </Box>
    </Box>
  );
}
