'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import TankLevelGauge from '@/components/TankLevelGauge';
import AreaChart from '@/components/charts/AreaChart';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import EmptyState from '@/components/EmptyState';
import StorageIcon from '@mui/icons-material/Storage';
import { tanksApi } from '@/lib/api';
import { feedstockTypeLabels } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import { exportToExcel, formatDataForExport } from '@/lib/export';
import { useToast } from '@/contexts/ToastContext';
import { usePolling } from '@/lib/hooks/usePolling';

interface MovementRow {
  id: string;
  dateLabel: string;
  type: 'load' | 'discharge' | 'transfer' | 'adjustment';
  status: boolean;
  movementVolume: number;
  tankAfter: number;
  notes: string | null;
}

export default function TankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tankId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { success, error } = useToast();

  const { data: tank, isLoading: tankLoading } = useQuery({
    queryKey: ['tank', tankId],
    queryFn: () => tanksApi.getById(tankId),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['tank-history', tankId],
    queryFn: () => tanksApi.getHistory(tankId),
  });

  const deleteMutation = useMutation({
    mutationFn: tanksApi.delete,
    onSuccess: () => {
      success('Tank decommissioned successfully');
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/tanks');
    },
    onError: () => {
      error('Failed to decommission tank');
    },
  });

  usePolling(
    () => {
      queryClient.invalidateQueries({ queryKey: ['tank', tankId] });
      queryClient.invalidateQueries({ queryKey: ['tank-history', tankId] });
    },
    Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL) || 30000,
    true
  );

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(tankId);
    setDeleteDialogOpen(false);
  };

  const handleExport = () => {
    if (!history || history.length === 0) {
      error('No data to export');
      return;
    }

    const exportData = formatDataForExport(history, {
      id: 'ID',
      type: 'Type',
      tank_id: 'Tank ID',
      target_tank_id: 'Target Tank ID',
      expected_volume: 'Expected Volume (bbl)',
      actual_volume: 'Actual Volume (bbl)',
      scheduled_date: 'Scheduled Date',
      created_at: 'Created At',
      notes: 'Notes'
    });

    exportToExcel({
      filename: `${tank?.name.replace(/\s+/g, '_')}_history`,
      data: exportData
    });

    success('Export completed successfully');
  };

  const isLoading = tankLoading || historyLoading;

  const columns: GridColDef<MovementRow>[] = [
    {
      field: 'dateLabel',
      headerName: 'Date',
      flex: 0.8,
      sortable: false,
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.9,
      renderCell: (params: GridRenderCellParams<MovementRow>) => (
        <MovementTypeChip type={params.row.type} />
      ),
      sortable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      renderCell: (params: GridRenderCellParams<MovementRow>) => (
        <MovementStatus isPending={params.row.status} />
      ),
      sortable: false,
    },
    {
      field: 'movementVolume',
      headerName: 'Movement (bbl)',
      flex: 1,
      type: 'number',
      renderCell: (params: GridRenderCellParams<MovementRow, MovementRow['movementVolume']>) => (
        <Typography sx={{ fontWeight: 600 }}>{(params.value ?? 0).toLocaleString()} bbl</Typography>
      ),
    },
    {
      field: 'tankAfter',
      headerName: 'Tank After (bbl)',
      flex: 1,
      type: 'number',
      renderCell: (params: GridRenderCellParams<MovementRow, MovementRow['tankAfter']>) => (
        <Typography sx={{ fontWeight: 600, color: 'var(--color-accent-cyan)' }}>{(params.value ?? 0).toLocaleString()} bbl</Typography>
      ),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1.6,
      renderCell: (params: GridRenderCellParams<MovementRow, MovementRow['notes']>) => (
        <Typography sx={{ color: 'text.secondary' }}>{params.value || '—'}</Typography>
      ),
    },
  ];

  const sortedHistory = useMemo(() => (
    history ? [...history].sort(
      (a, b) => {
        const left = a.scheduled_date || a.created_at;
        const right = b.scheduled_date || b.created_at;
        return new Date(left).getTime() - new Date(right).getTime();
      }
    ) : []
  ), [history]);

  const startingLevel = tank?.initial_level || 0;
  const runningBalanceRows = sortedHistory.map((movement) => {
    const isOutgoing = movement.type === 'discharge' || (movement.type === 'transfer' && movement.tank_id === tankId);
    const sign = isOutgoing ? -1 : 1;
    const movementVolume = Math.abs(movement.actual_volume ?? movement.expected_volume);
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

  const rows = useMemo(() => runningBalanceRows.reduce<MovementRow[]>((acc, row) => {
    const previousTotal = acc.length ? acc[acc.length - 1].tankAfter : startingLevel;
    const tankAfter = Math.max(previousTotal + row.movementVolume, 0);
    acc.push({ ...row, tankAfter });
    return acc;
  }, []), [runningBalanceRows, startingLevel]);

  const levelChartData = useMemo(() => {
    if (!rows.length) return [];
    const data: Array<[number, number]> = [
      [new Date(tank?.created_at || 0).getTime(), tank?.initial_level || 0],
      ...rows.map(row => {
        const movement = sortedHistory.find(m => m.id === row.id);
        const timestamp = movement
          ? new Date(movement.scheduled_date || movement.created_at).getTime()
          : 0;
        return [timestamp, row.tankAfter] as [number, number];
      })
    ];
    return data.sort((a, b) => a[0] - b[0]);
  }, [rows, sortedHistory, tank]);

  const levelPercentage = tank?.level_percentage ?? 0;
  const levelStatusColor = levelPercentage < 20 ? '#ff5252' : levelPercentage < 50 ? '#ffb300' : '#00e676';
  const levelStatusText = levelPercentage < 20 ? 'LOW' : levelPercentage < 50 ? 'MEDIUM' : 'OPTIMAL';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  if (!tank) {
    return (
      <EmptyState
        icon={<StorageIcon />}
        title="Unit Not Found"
        description="The requested storage unit could not be located."
        action={{
          label: 'Return to Registry',
          href: '/tanks'
        }}
      />
    );
  }

  return (
    <Box>
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Decommission Storage Unit"
        message={`Are you sure you want to decommission "${tank.name}"? This action cannot be undone, and the tank will be removed from the registry. Movement history will be preserved.`}
        confirmText="Decommission"
        cancelText="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          p: 2,
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          background: 'linear-gradient(120deg, rgba(14, 21, 34, 0.92), rgba(9, 14, 23, 0.9))',
          boxShadow: '0 20px 50px rgba(5, 10, 18, 0.55)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <IconButton onClick={() => router.push('/tanks')} sx={{ color: 'text.secondary', '&:hover': { color: 'var(--color-accent-cyan)' } }} aria-label="Back to tanks">
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.25em' }}>
            Unit Telemetry
          </Typography>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700 }}>
            {tank.name}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
            {tank.location} • {feedstockTypeLabels[tank.feedstock_type]} • {tank.capacity.toLocaleString()} bbl
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.12em' }}>
            ID: {tank.id.toUpperCase()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={levelStatusText}
            size="small"
            sx={{
              bgcolor: levelStatusColor === '#ff5252'
                ? 'rgba(255, 82, 82, 0.12)'
                : levelStatusText === 'MEDIUM'
                ? 'rgba(255, 179, 0, 0.12)'
                : 'rgba(0, 230, 118, 0.12)',
              color: levelStatusColor,
              fontWeight: 700,
              letterSpacing: '0.08em',
              border: `1px solid ${levelStatusColor}40`,
            }}
          />
          <Chip
            label={`${tank.level_percentage.toFixed(1)}% FULL`}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 229, 255, 0.12)',
              color: 'var(--color-accent-cyan)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              border: '1px solid rgba(0, 229,255, 0.25)',
            }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            disabled={!history || history.length === 0}
            sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: '0.75rem', '&:hover': { color: 'var(--color-accent-cyan)', borderColor: 'var(--color-accent-cyan)' } }}
            aria-label="Export tank history"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={handleDelete}
            sx={{ color: '#ff5252', borderColor: '#ff5252', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)', borderColor: '#ff5252' } }}
            aria-label="Decommission tank"
          >
            Decommission
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))',
              mb: 3
            }}
          >
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              Capacity Utilization
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TankLevelGauge percentage={tank.level_percentage} showLabel={true} />
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ borderLeft: '2px solid var(--color-accent-cyan)', pl: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.12em' }}>
                  CURRENT LEVEL
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
                  {tank.current_level.toLocaleString()} bbl
                </Typography>
              </Box>
              <Box sx={{ borderLeft: '2px solid rgba(139, 92, 246, 0.6)', pl: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.12em' }}>
                  REMAINING CAPACITY
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(139, 92, 246, 0.8)' }}>
                  {(tank.capacity - tank.current_level).toLocaleString()} bbl
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))',
              mb: 3
            }}
          >
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              Level History
            </Typography>
            <AreaChart
              data={levelChartData}
              height={200}
              name="Tank Level (bbl)"
              color="#00e5ff"
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))',
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: '1fr 1fr'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
                CAPACITY
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{tank.capacity.toLocaleString()} bbl</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
                FEEDSTOCK TYPE
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{feedstockTypeLabels[tank.feedstock_type]}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
                INITIAL LEVEL
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{(tank.initial_level || 0).toLocaleString()} bbl</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
                TOTAL MOVEMENTS
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{(history?.length || 0).toLocaleString()}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5, mb: 2 }}>
        <SectionHeader title="Activity Timeline" />
      </Box>

      <Box sx={{ height: 460, width: '100%' }}>
        {!history || history.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              background: 'linear-gradient(140deg, rgba(12, 18, 30, 0.9), rgba(8, 12, 21, 0.85))'
            }}
          >
            <EmptyState
              icon={<StorageIcon />}
              title="No Activity Recorded"
              description="This tank has no movement history yet."
            />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            sx={{
              border: '1px solid var(--glass-border)',
              background: 'linear-gradient(140deg, rgba(12, 18, 30, 0.9), rgba(8, 12, 21, 0.85))',
              borderRadius: '12px',
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.08), rgba(139, 92, 246, 0.12))',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
              },
              '& .MuiDataGrid-cellContent': {
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(even)': {
                  backgroundColor: 'rgba(0, 229, 255, 0.02)',
                },
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.04)',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid rgba(0, 229, 255, 0.15)',
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
}
