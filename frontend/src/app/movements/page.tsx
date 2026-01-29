'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { GridColDef, GridRowSelectionModel, GridPaginationModel } from '@mui/x-data-grid';
import { movementsApi, tanksApi } from '@/lib/api';
import { formatDate, getLocalToday } from '@/lib/dateUtils';
import { useToast } from '@/contexts/ToastContext';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import {
  useMovementsViewModel,
  MovementSummaryCards,
  MovementsTableSection,
  ManualEntryForm,
  PdfImportForm,
  CompleteDialog,
  EditDialog,
  MovementGridRowExtended,
} from '@/components/movements';
import type {
  MovementCreate,
  Movement,
  MovementType,
  MovementUpdate,
  TransferTargetCreate,
} from '@/lib/types';

export default function MovementsPage() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [actualVolume, setActualVolume] = useState<number>(0);
  const [editData, setEditData] = useState<MovementUpdate>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [activeTab, setActiveTab] = useState(0);
  // Server-side pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const today = getLocalToday();
  const [formData, setFormData] = useState<MovementCreate>({
    type: 'load',
    tank_id: '',
    target_tank_id: '',
    expected_volume: 0,
    scheduled_date: today,
    notes: '',
  });
  const [transferTargets, setTransferTargets] = useState<TransferTargetCreate[]>([]);

  // Build API filter params (only pass non-'all' values)
  const apiFilters = {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements', paginationModel.page, paginationModel.pageSize, apiFilters],
    queryFn: ({ signal }) => movementsApi.getAll({
      ...apiFilters,
      skip: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
    }, signal),
  });

  const movements = movementsData?.items;
  const totalMovements = movementsData?.total ?? 0;

  // Reset to page 0 when filters change
  const handleStatusFilterChange = (value: 'all' | 'pending' | 'completed') => {
    setStatusFilter(value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleTypeFilterChange = (value: MovementType | 'all') => {
    setTypeFilter(value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: movementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      setFormData({
        type: formData.type,
        tank_id: '',
        target_tank_id: '',
        expected_volume: 0,
        scheduled_date: today,
        notes: '',
      });
      setTransferTargets([]);
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const transferMutation = useMutation({
    mutationFn: movementsApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      setFormData({
        type: formData.type,
        tank_id: '',
        target_tank_id: '',
        expected_volume: 0,
        scheduled_date: today,
        notes: '',
      });
      setTransferTargets([]);
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const resetCompleteState = () => {
    setCompleteDialogOpen(false);
    setSelectedMovement(null);
    setActualVolume(0);
  };

  const completeMutation = useMutation({
    mutationFn: ({ id, actual_volume }: { id: string; actual_volume: number }) =>
      movementsApi.complete(id, { actual_volume }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      resetCompleteState();
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const resetEditState = () => {
    setEditDialogOpen(false);
    setSelectedMovement(null);
    setEditData({});
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MovementUpdate }) =>
      movementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      resetEditState();
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tank_id || (formData.type !== 'transfer' && formData.expected_volume <= 0)) return;

    if (formData.type === 'transfer') {
      if (transferTargets.length === 0) return;
      if (transferTargets.some((target) => !target.tank_id || target.volume <= 0)) return;

      transferMutation.mutate({
        source_tank_id: formData.tank_id,
        targets: transferTargets,
        scheduled_date: formData.scheduled_date,
        notes: formData.notes || undefined,
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleOpenComplete = (movement: Movement) => {
    setSelectedMovement(movement);
    setActualVolume(movement.expected_volume || 0);
    setCompleteDialogOpen(true);
  };

  const handleBulkComplete = async () => {
    const pendingMovements = (movements || []).filter(
      (movement) => selectedRows.ids.has(movement.id) && movement.actual_volume === null
    );
    if (pendingMovements.length === 0) return;
    if (!confirm(`Complete ${pendingMovements.length} movements with expected volumes?`)) return;

    try {
      await Promise.all(
        pendingMovements.map((movement) =>
          completeMutation.mutateAsync({ id: movement.id, actual_volume: movement.expected_volume || 0 })
        )
      );
    } catch {
      // Errors are handled by the mutation's onError callback
    }
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  const handleComplete = () => {
    if (!selectedMovement || actualVolume <= 0) return;
    completeMutation.mutate({ id: selectedMovement.id, actual_volume: actualVolume });
  };

  const handleOpenEdit = (movement: Movement) => {
    setSelectedMovement(movement);
    setEditData({
      scheduled_date_manual: movement.scheduled_date || '',
      expected_volume_manual: movement.expected_volume,
      notes_manual: movement.notes || '',
      strategy_manual: movement.strategy,
      destination_manual: movement.destination || '',
      equipment_manual: movement.equipment || '',
      discharge_date_manual: movement.discharge_date || '',
      base_diff_manual: movement.base_diff,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedMovement) return;
    updateMutation.mutate({ id: selectedMovement.id, data: editData });
  };

  const handleBulkReschedule = async () => {
    if (!editData.scheduled_date_manual) return;
    const pendingMovements = (movements || []).filter(
      (movement) => selectedRows.ids.has(movement.id) && movement.actual_volume === null
    );
    if (pendingMovements.length === 0) return;
    if (!confirm(`Reschedule ${pendingMovements.length} movements to ${editData.scheduled_date_manual}?`)) return;

    try {
      await Promise.all(
        pendingMovements.map((movement) =>
          updateMutation.mutateAsync({ id: movement.id, data: { scheduled_date_manual: editData.scheduled_date_manual } })
        )
      );
    } catch {
      // Errors are handled by the mutation's onError callback
    }
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  const isLoading = movementsLoading || tanksLoading;

  const {
    tankMap,
    targetTanks,
    availableTargetTanks,
    totalTransferVolume,
    remainingTransferVolume,
    summaryStats,
    rows,
  } = useMovementsViewModel({
    movements,
    tanks,
    formData,
    transferTargets,
    searchQuery,
    statusFilter,
    typeFilter,
  });

  const movementMap = useMemo(
    () => new Map(movements?.map((m) => [m.id, m]) || []),
    [movements]
  );

  const handleEditClick = useCallback((movementId: string) => {
    const movement = movementMap.get(movementId);
    if (movement) handleOpenEdit(movement);
  }, [movementMap]);

  const handleCompleteClick = useCallback((movementId: string) => {
    const movement = movementMap.get(movementId);
    if (movement) handleOpenComplete(movement);
  }, [movementMap]);

  const columns = useMemo<GridColDef<MovementGridRowExtended>[]>(() => [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 100,
      flex: 0.8,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {formatDate(params.row.date)}
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => (
        <MovementTypeChip type={params.value as MovementType} />
      ),
      sortable: false,
    },
    {
      field: 'tankName',
      headerName: 'Tank',
      minWidth: 140,
      flex: 1,
    },
    {
      field: 'expectedVolume',
      headerName: 'Expected',
      minWidth: 110,
      flex: 0.8,
      type: 'number',
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }} noWrap>
          {Number(params.value || 0).toLocaleString()} bbl
        </Typography>
      ),
    },
    {
      field: 'actualVolume',
      headerName: 'Actual',
      minWidth: 110,
      flex: 0.8,
      type: 'number',
      renderCell: (params) => (
        <Typography sx={{ color: params.value === null ? 'text.secondary' : 'text.primary', fontSize: '0.8rem' }} noWrap>
          {params.value === null ? '—' : `${Number(params.value).toLocaleString()} bbl`}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => (
        <MovementStatus isPending={Boolean(params.value)} />
      ),
      sortable: false,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      minWidth: 150,
      flex: 1.2,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => {
        const { row } = params;
        const isPending = row.status;
        const isAdjustment = row.type === 'adjustment';
        if (!isPending || isAdjustment) return null;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleEditClick(row.id)}
              title="Edit movement"
              aria-label="Edit movement"
              sx={{ color: '#ffab00', '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.1)' } }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleCompleteClick(row.id)}
              title="Complete movement"
              aria-label="Complete movement"
              sx={{ color: 'var(--color-accent-cyan)', '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.1)' } }}
            >
              <CheckCircleIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        );
      }
    },
  ], [handleEditClick, handleCompleteClick]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          Feedstock Operations
        </Typography>
        <Box sx={{ width: 60, height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.35)' }} />
      </Box>

      <MovementSummaryCards summaryStats={summaryStats} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                },
                '& .Mui-selected': {
                  color: activeTab === 0 ? 'var(--color-accent-cyan)' : '#a78bfa',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: activeTab === 0 ? 'var(--color-accent-cyan)' : '#a78bfa',
                },
              }}
            >
              <Tab label="Manual Entry" />
              <Tab label="PDF Import" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <ManualEntryForm
              formData={formData}
              onFormDataChange={setFormData}
              transferTargets={transferTargets}
              onTransferTargetsChange={setTransferTargets}
              tanks={tanks || []}
              targetTanks={targetTanks}
              availableTargetTanks={availableTargetTanks}
              totalTransferVolume={totalTransferVolume}
              remainingTransferVolume={remainingTransferVolume}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending || transferMutation.isPending}
            />
          )}
          {activeTab === 1 && <PdfImportForm tanks={tanks || []} />}
        </Grid>

        <MovementsTableSection
          rows={rows}
          columns={columns}
          selection={{
            selectedRows,
            onSelectedRowsChange: setSelectedRows,
          }}
          filters={{
            searchQuery,
            onSearchQueryChange: setSearchQuery,
            statusFilter,
            onStatusFilterChange: handleStatusFilterChange,
            typeFilter,
            onTypeFilterChange: handleTypeFilterChange,
          }}
          bulkActions={{
            editData,
            onEditDataChange: setEditData,
            onBulkComplete: handleBulkComplete,
            onBulkReschedule: handleBulkReschedule,
          }}
          pagination={{
            paginationModel,
            onPaginationModelChange: setPaginationModel,
            rowCount: totalMovements,
          }}
          loading={movementsLoading}
        />
      </Grid>

      <CompleteDialog
        open={completeDialogOpen}
        onClose={resetCompleteState}
        movement={selectedMovement}
        tankMap={tankMap}
        actualVolume={actualVolume}
        onActualVolumeChange={setActualVolume}
        onComplete={handleComplete}
        isSubmitting={completeMutation.isPending}
      />

      <EditDialog
        open={editDialogOpen}
        onClose={resetEditState}
        movement={selectedMovement}
        tankMap={tankMap}
        editData={editData}
        onEditDataChange={setEditData}
        onEdit={handleEdit}
        isSubmitting={updateMutation.isPending}
      />
    </Box>
  );
}
