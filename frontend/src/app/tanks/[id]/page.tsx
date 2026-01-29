'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import { DynamicTankActivityChart } from '@/components/charts/DynamicCharts';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import EmptyState from '@/components/EmptyState';
import { EditDialog, CompleteDialog } from '@/components/movements';
import StyledDataGrid from '@/components/StyledDataGrid';
import StorageIcon from '@mui/icons-material/Storage';
import { adjustmentsApi } from '@/lib/api';
import { feedstockTypeLabels, openPdfInNewTab, buttonStyles } from '@/lib/constants';
import { formatDate, compareDates, isWithinRange } from '@/lib/dateUtils';
import { exportToExcel, formatDataForExport } from '@/lib/export';
import { useTankDetail } from '@/lib/hooks/useTankDetail';
import { useToast } from '@/contexts/ToastContext';
import type { Movement, MovementUpdate, TankWithLevel } from '@/lib/types';

interface MovementRow {
  id: string;
  dateLabel: string;
  type: 'load' | 'discharge' | 'transfer' | 'adjustment';
  status: boolean;
  movementVolume: number;
  tankAfter: number;
  notes: string | null;
  pdfUrl: string | null;
  actualVolume: number | null;
  rawMovement: Movement;
}

export default function TankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tankId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [editData, setEditData] = useState<MovementUpdate>({});
  const [actualVolume, setActualVolume] = useState<number>(0);

  const {
    tank,
    history,
    isLoading,
    deleteTank,
    updateMovement,
    completeMovement,
    isDeleting,
    isUpdating,
    isCompleting,
  } = useTankDetail({ tankId });

  const { success, error } = useToast();

  const resetEditState = () => {
    setEditDialogOpen(false);
    setSelectedMovement(null);
    setEditData({});
  };

  const resetCompleteState = () => {
    setCompleteDialogOpen(false);
    setSelectedMovement(null);
    setActualVolume(0);
  };

  const handleOpenEdit = useCallback((movement: Movement) => {
    setSelectedMovement(movement);
    setEditData({
      scheduled_date_manual: movement.scheduled_date || '',
      expected_volume_manual: movement.expected_volume,
      notes_manual: movement.notes || '',
    });
    setEditDialogOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedMovement) return;
    updateMovement(selectedMovement.id, editData);
    resetEditState();
  }, [selectedMovement, updateMovement, editData]);

  const handleOpenComplete = useCallback((movement: Movement) => {
    setSelectedMovement(movement);
    setActualVolume(movement.expected_volume || 0);
    setCompleteDialogOpen(true);
  }, []);

  const handleComplete = useCallback(() => {
    if (!selectedMovement || !Number.isFinite(actualVolume) || actualVolume <= 0) return;
    completeMovement(selectedMovement.id, actualVolume);
    resetCompleteState();
  }, [selectedMovement, actualVolume, completeMovement]);

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deleteTank();
    setDeleteDialogOpen(false);
  }, [deleteTank]);

  // Create tankMap for dialogs (just the current tank)
  const tankMap = useMemo(() => {
    const map = new Map<string, TankWithLevel>();
    if (tank) {
      map.set(tank.id, tank);
    }
    return map;
  }, [tank]);

  const columns = useMemo<GridColDef<MovementRow>[]>(() => [
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
      flex: 1.4,
      renderCell: (params: GridRenderCellParams<MovementRow, MovementRow['notes']>) => (
        <Typography sx={{ color: 'text.secondary' }}>{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'pdfUrl',
      headerName: 'PDF',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams<MovementRow, MovementRow['pdfUrl']>) => {
        if (!params.value) return <Typography sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>—</Typography>;
        return (
          <Tooltip title="View source PDF">
            <IconButton
              size="small"
              onClick={() => openPdfInNewTab(params.value!, adjustmentsApi.getPdfUrl)}
              sx={{ color: 'var(--color-accent-cyan)' }}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 90,
      renderCell: (params: GridRenderCellParams<MovementRow>) => {
        const row = params.row;
        const isPending = row.actualVolume === null;
        const isAdjustment = row.type === 'adjustment';
        if (!isPending || isAdjustment) return null;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleOpenEdit(row.rawMovement)}
              title="Edit movement"
              aria-label="Edit movement"
              sx={{ color: '#ffab00', '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.1)' } }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleOpenComplete(row.rawMovement)}
              title="Complete movement"
              aria-label="Complete movement"
              sx={{ color: 'var(--color-accent-cyan)', '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.1)' } }}
            >
              <CheckCircleIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        );
      },
    },
  ], [handleOpenEdit, handleOpenComplete]);

  const sortedHistory = useMemo(() => (
    history ? [...history].sort(
      (a, b) => compareDates(
        a.scheduled_date || a.created_at,
        b.scheduled_date || b.created_at
      )
    ) : []
  ), [history]);

  const filteredHistory = useMemo(() => {
    if (!sortedHistory.length) return [];
    if (!dateRange.start && !dateRange.end) return sortedHistory;

    return sortedHistory.filter((movement) => {
      const dateValue = movement.scheduled_date || movement.created_at;
      return isWithinRange(dateValue, dateRange.start, dateRange.end);
    });
  }, [sortedHistory, dateRange.end, dateRange.start]);

  const handleExport = useCallback(() => {
    if (!filteredHistory.length) {
      error('No data to export');
      return;
    }

    const exportData = formatDataForExport(filteredHistory, {
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
  }, [filteredHistory, tank?.name, error, success]);

  const rangeStartTimestamp = dateRange.start ? new Date(dateRange.start).getTime() : null;

  // Build Map for O(1) history lookups (used in chart data computation)
  const historyTimestampMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of filteredHistory) {
      const timestamp = new Date(m.scheduled_date || m.created_at).getTime();
      map.set(m.id, timestamp);
    }
    return map;
  }, [filteredHistory]);

  const initialLevel = tank?.initial_level || 0;
  const initialTimestamp = new Date(tank?.created_at || 0).getTime();

  const startingLevel = useMemo(() => {
    const initialLevel = tank?.initial_level || 0;
    if (!rangeStartTimestamp || !sortedHistory.length) return initialLevel;

    return sortedHistory.reduce((total, movement) => {
      const timestamp = new Date(movement.scheduled_date || movement.created_at).getTime();
      if (timestamp >= rangeStartTimestamp) return total;
      const isOutgoing = movement.type === 'discharge'
        || (movement.type === 'transfer' && movement.tank_id === tankId);
      const sign = isOutgoing ? -1 : 1;
      const movementVolume = Math.abs(movement.actual_volume ?? (movement.expected_volume || 0));
      return total + sign * movementVolume;
    }, initialLevel);
  }, [rangeStartTimestamp, sortedHistory, tank?.initial_level, tankId]);

  const runningBalanceRows = useMemo(() => filteredHistory.map((movement) => {
    const isOutgoing = movement.type === 'discharge' || (movement.type === 'transfer' && movement.tank_id === tankId);
    const sign = isOutgoing ? -1 : 1;
    const movementVolume = Math.abs(movement.actual_volume ?? (movement.expected_volume || 0));
    const movementDate = movement.scheduled_date || movement.created_at;

    return {
      id: movement.id,
      dateLabel: formatDate(movementDate),
      type: movement.type,
      status: movement.actual_volume === null,
      movementVolume: sign * movementVolume,
      tankAfter: 0,
      notes: movement.notes || null,
      pdfUrl: movement.pdf_url || null,
      actualVolume: movement.actual_volume,
      rawMovement: movement,
    };
  }), [filteredHistory, tankId]);

  const rows = useMemo(() => runningBalanceRows.reduce<MovementRow[]>((acc, row) => {
    const previousTotal = acc.length ? acc[acc.length - 1].tankAfter : startingLevel;
    const tankAfter = Math.max(previousTotal + row.movementVolume, 0);
    acc.push({ ...row, tankAfter });
    return acc;
  }, []), [runningBalanceRows, startingLevel]);

  const levelChartData = useMemo(() => {
    if (!rows.length) return [];
    const data = rows.map(row => {
      const timestamp = historyTimestampMap.get(row.id) || 0;
      return [timestamp, row.tankAfter] as [number, number];
    });
    if (rangeStartTimestamp !== null) {
      data.push([rangeStartTimestamp, startingLevel]);
    } else if (initialTimestamp) {
      data.push([initialTimestamp, initialLevel]);
    }
    return data.sort((a, b) => a[0] - b[0]);
  }, [rows, historyTimestampMap, rangeStartTimestamp, startingLevel, initialTimestamp, initialLevel]);

  const movementChartData = useMemo(() => {
    return rows.map(row => {
      const timestamp = historyTimestampMap.get(row.id) || 0;
      return [timestamp, row.movementVolume] as [number, number];
    }).sort((a, b) => a[0] - b[0]);
  }, [rows, historyTimestampMap]);

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
        title="Tank Not Found"
        description="The requested tank could not be located."
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
        title="Delete Tank"
        message={`Are you sure you want to delete "${tank.name}"? This action cannot be undone, and the tank will be removed from the registry. Movement history will be preserved.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
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
          backgroundColor: 'rgba(12, 18, 29, 0.92)',
          boxShadow: '0 20px 50px rgba(5, 10, 18, 0.55)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <IconButton onClick={() => router.push('/tanks')} sx={{ color: 'text.secondary', '&:hover': { color: 'var(--color-accent-cyan)' } }} aria-label="Back to tanks">
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.25em' }}>
            Tank Details
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
            sx={{ ...buttonStyles.danger, fontSize: '0.75rem' }}
            aria-label="Delete tank"
          >
            Delete
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
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              mb: 3
            }}
          >
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              Level History (range-only balance)
            </Typography>
            <DynamicTankActivityChart
              levelData={levelChartData}
              movementData={movementChartData}
              height={200}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
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
              <Typography sx={{ fontWeight: 600 }}>{(filteredHistory.length || 0).toLocaleString()}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5, mb: 2 }}>
        <SectionHeader title="Activity Timeline" />
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            size="small"
            type="date"
            label="Start date"
            value={dateRange.start}
            onChange={(event) => {
              const newStart = event.target.value;
              setDateRange((prev) => ({
                start: newStart,
                end: prev.end && newStart > prev.end ? '' : prev.end
              }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="End date"
            value={dateRange.end}
            onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: dateRange.start || undefined }
            }}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => setDateRange({ start: '', end: '' })}
            disabled={!dateRange.start && !dateRange.end}
            sx={{ borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Balance is recalculated for the selected range and may not match the current tank level.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: 460, width: '100%' }}>
        {!filteredHistory.length ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              backgroundColor: 'rgba(10, 15, 26, 0.9)'
            }}
          >
            <EmptyState
              icon={<StorageIcon />}
              title="No Activity Recorded"
              description="This tank has no movement history yet."
            />
          </Box>
        ) : (
          <StyledDataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            variant="striped"
          />
        )}
      </Box>

      <EditDialog
        open={editDialogOpen}
        onClose={resetEditState}
        movement={selectedMovement}
        tankMap={tankMap}
        editData={editData}
        onEditDataChange={setEditData}
        onEdit={handleEdit}
        isSubmitting={isUpdating}
      />

      <CompleteDialog
        open={completeDialogOpen}
        onClose={resetCompleteState}
        movement={selectedMovement}
        tankMap={tankMap}
        actualVolume={actualVolume}
        onActualVolumeChange={setActualVolume}
        onComplete={handleComplete}
        isSubmitting={isCompleting}
      />
    </Box>
  );
}
