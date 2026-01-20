'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { movementsApi, tanksApi, importsApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles, dataGridSx, movementTypeLabels, movementTypeColors, movementTypeChipColors } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import { useToast } from '@/contexts/ToastContext';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import GlassDialog from '@/components/GlassDialog';
import type {
  MovementCreate,
  Movement,
  MovementType,
  MovementUpdate,
  TransferTargetCreate,
  TankWithLevel,
  MovementGridRow,
  MovementSummaryStats,
  PDFExtractionResult,
  PDFMovementWithMatches,
  PDFImportConfirmItem,
} from '@/lib/types';

type MovementSource = 'manual' | 'pdf';

interface MovementGridRowExtended extends MovementGridRow {
  source: MovementSource;
}

interface MovementsViewModelInput {
  movements?: Movement[];
  tanks?: TankWithLevel[];
  formData: MovementCreate;
  transferTargets: TransferTargetCreate[];
  todayDate: Date;
  searchQuery: string;
  statusFilter: 'all' | 'pending' | 'completed';
  typeFilter: MovementType | 'all';
  sourceFilter: MovementSource | 'all';
}

function useMovementsViewModel({
  movements,
  tanks,
  formData,
  transferTargets,
  todayDate,
  searchQuery,
  statusFilter,
  typeFilter,
  sourceFilter,
}: MovementsViewModelInput) {
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
      return new Date(dateValue).toDateString() === todayDate.toDateString();
    }).length || 0;
    return { total, pending, completed, scheduledToday };
  }, [movements, todayDate]);

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
        const isFromPdf = movement.notes?.toLowerCase().includes('imported from pdf') || false;
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
      const scheduledDate = new Date(dateValue);
      const isFuture = scheduledDate > todayDate;
      const source: MovementSource = movement.notes?.toLowerCase().includes('imported from pdf') ? 'pdf' : 'manual';
      return {
        id: movement.id,
        date: dateValue,
        type: movement.type,
        tankName: `${tank?.name || 'Unknown'}${targetTank ? ` → ${targetTank.name}` : ''}`,
        expectedVolume: movement.expected_volume,
        actualVolume: movement.actual_volume,
        status: isPending,
        isFuture,
        notes: movement.notes || '',
        source,
      };
    })
  ), [filteredMovements, tankMap, todayDate]);

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

function MovementSummaryCards({ summaryStats }: { summaryStats: MovementSummaryStats }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {[
        { label: 'Scheduled Today', value: summaryStats.scheduledToday },
        { label: 'Pending', value: summaryStats.pending },
        { label: 'Completed', value: summaryStats.completed },
        { label: 'Total', value: summaryStats.total },
      ].map((stat) => (
        <Box key={stat.label} sx={styles.summaryCard}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            {stat.label.toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
            {stat.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// Source badge component
function SourceBadge({ source }: { source: MovementSource }) {
  if (source === 'pdf') {
    return (
      <Chip
        label="PDF"
        size="small"
        sx={{
          bgcolor: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          fontSize: '0.6rem',
          fontWeight: 700,
          height: 20,
        }}
      />
    );
  }
  return (
    <Chip
      label="Manual"
      size="small"
      sx={{
        bgcolor: 'rgba(0, 229, 255, 0.1)',
        color: 'var(--color-accent-cyan)',
        fontSize: '0.6rem',
        fontWeight: 700,
        height: 20,
      }}
    />
  );
}

interface MovementsTableSectionProps {
  rows: MovementGridRowExtended[];
  columns: GridColDef[];
  selectedRows: GridRowSelectionModel;
  onSelectedRowsChange: (selection: GridRowSelectionModel) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusFilterChange: (value: 'all' | 'pending' | 'completed') => void;
  typeFilter: MovementType | 'all';
  onTypeFilterChange: (value: MovementType | 'all') => void;
  sourceFilter: MovementSource | 'all';
  onSourceFilterChange: (value: MovementSource | 'all') => void;
  editData: MovementUpdate;
  onEditDataChange: (data: MovementUpdate) => void;
  onBulkComplete: () => void;
  onBulkReschedule: () => void;
}

function MovementsTableSection({
  rows,
  columns,
  selectedRows,
  onSelectedRowsChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  editData,
  onEditDataChange,
  onBulkComplete,
  onBulkReschedule,
}: MovementsTableSectionProps) {
  return (
    <Grid size={{ xs: 12, md: 7 }}>
      <Box sx={{ mb: 2 }}>
        <SectionHeader title="Operation Log" />
      </Box>

      {/* Unified filter bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          mb: 2,
          p: 1.5,
          borderRadius: '8px',
          bgcolor: 'rgba(0, 229, 255, 0.03)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <TextField
          size="small"
          placeholder="Search tanks, notes…"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          inputProps={{ 'aria-label': 'Search movements' }}
          sx={{ minWidth: 140, flex: '1 1 140px' }}
        />
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'pending' | 'completed')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => onTypeFilterChange(e.target.value as MovementType | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="load">Load</MenuItem>
            <MenuItem value="discharge">Discharge</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
            <MenuItem value="adjustment">Adjustment</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={sourceFilter}
            label="Source"
            onChange={(e) => onSourceFilterChange(e.target.value as MovementSource | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="manual">Manual</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            Selected: {selectedRows.ids.size}
          </Typography>
          <TextField
            size="small"
            type="date"
            value={editData.scheduled_date || ''}
            onChange={(e) => onEditDataChange({ ...editData, scheduled_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            inputProps={{ 'aria-label': 'Reschedule date' }}
            sx={{ width: 140 }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={selectedRows.ids.size === 0 || !editData.scheduled_date}
            onClick={onBulkReschedule}
            sx={{ borderColor: 'var(--color-accent-cyan)', color: 'var(--color-accent-cyan)', whiteSpace: 'nowrap' }}
          >
            Reschedule
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={selectedRows.ids.size === 0}
            onClick={onBulkComplete}
            sx={{ borderColor: '#00e676', color: '#00e676', whiteSpace: 'nowrap' }}
          >
            Complete
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          checkboxSelection
          onRowSelectionModelChange={onSelectedRowsChange}
          rowSelectionModel={selectedRows}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          getRowClassName={(params) => {
            const statusClass = params.row.status ? 'row-pending' : 'row-complete';
            const futureClass = params.row.isFuture ? 'row-future' : '';
            return `${statusClass} ${futureClass}`.trim();
          }}
          sx={{
            ...dataGridSx,
            '& .MuiDataGrid-row': {
              '&:nth-of-type(even)': {
                backgroundColor: alpha('#00e5ff', 0.02),
              },
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.04)',
            },
            '& .row-pending': {
              backgroundColor: alpha('#ffb300', 0.06),
            },
            '& .row-complete': {
              backgroundColor: alpha('#00e676', 0.05),
            },
            '& .row-future': {
              boxShadow: 'inset 3px 0 0 rgba(139, 92, 246, 0.6)',
            },
          }}
        />
      </Box>
    </Grid>
  );
}

// PDF Import types
interface SelectedMovement {
  fileIndex: number;
  movementIndex: number;
  tankId: string;
  type: MovementType;
  volume: number;
  date: string;
  notes?: string;
}

const pdfImportSteps = ['Upload PDFs', 'Review & Match', 'Confirm Import'];

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
  const [sourceFilter, setSourceFilter] = useState<MovementSource | 'all'>('all');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // PDF Import state
  const [pdfStep, setPdfStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [extractionResults, setExtractionResults] = useState<PDFExtractionResult[]>([]);
  const [selectedPdfMovements, setSelectedPdfMovements] = useState<Map<string, SelectedMovement>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayDate = useMemo(() => new Date(today), [today]);
  const [formData, setFormData] = useState<MovementCreate>({
    type: 'load',
    tank_id: '',
    target_tank_id: '',
    expected_volume: 0,
    scheduled_date: today,
    notes: '',
  });
  const [transferTargets, setTransferTargets] = useState<TransferTargetCreate[]>([]);

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.getAll(),
  });

  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: movementsApi.create,
    onSuccess: () => {
      invalidateCommonQueries(queryClient);
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
      invalidateCommonQueries(queryClient);
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
      invalidateCommonQueries(queryClient);
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
      invalidateCommonQueries(queryClient);
      resetEditState();
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  // PDF Import mutations
  const extractMutation = useMutation({
    mutationFn: importsApi.extractFromPDFs,
    onSuccess: (results) => {
      setExtractionResults(results);
      // Pre-select exact matches
      const newSelections = new Map<string, SelectedMovement>();
      results.forEach((result, fileIndex) => {
        result.movements.forEach((movement, movementIndex) => {
          const key = `${fileIndex}-${movementIndex}`;
          if (movement.is_exact_match && movement.best_match) {
            newSelections.set(key, {
              fileIndex,
              movementIndex,
              tankId: movement.best_match.tank_id,
              type: movement.movement_type,
              volume: movement.extracted.movement_qty,
              date: movement.extracted.movement_date || new Date().toISOString().split('T')[0],
              notes: `Imported from PDF: ${result.filename}`,
            });
          }
        });
      });
      setSelectedPdfMovements(newSelections);
      setPdfStep(1);
    },
  });

  const importMutation = useMutation({
    mutationFn: importsApi.confirmImport,
    onSuccess: () => {
      invalidateCommonQueries(queryClient);
      setPdfStep(2);
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
    setActualVolume(movement.expected_volume);
    setCompleteDialogOpen(true);
  };

  const handleBulkComplete = () => {
    const pendingMovements = (movements || []).filter(
      (movement) => selectedRows.ids.has(movement.id) && movement.actual_volume === null
    );
    if (pendingMovements.length === 0) return;
    if (!confirm(`Complete ${pendingMovements.length} movements with expected volumes?`)) return;
    pendingMovements.forEach((movement) => {
      completeMutation.mutate({ id: movement.id, actual_volume: movement.expected_volume });
    });
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  const handleComplete = () => {
    if (!selectedMovement || actualVolume <= 0) return;
    completeMutation.mutate({ id: selectedMovement.id, actual_volume: actualVolume });
  };

  const handleOpenEdit = (movement: Movement) => {
    setSelectedMovement(movement);
    setEditData({
      scheduled_date: movement.scheduled_date,
      expected_volume: movement.expected_volume,
      notes: movement.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedMovement) return;
    updateMutation.mutate({ id: selectedMovement.id, data: editData });
  };

  const handleBulkReschedule = () => {
    if (!editData.scheduled_date) return;
    const pendingMovements = (movements || []).filter(
      (movement) => selectedRows.ids.has(movement.id) && movement.actual_volume === null
    );
    if (pendingMovements.length === 0) return;
    if (!confirm(`Reschedule ${pendingMovements.length} movements to ${editData.scheduled_date}?`)) return;
    pendingMovements.forEach((movement) => {
      updateMutation.mutate({ id: movement.id, data: { scheduled_date: editData.scheduled_date } });
    });
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  // PDF Import handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf'
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtract = () => {
    if (files.length > 0) {
      extractMutation.mutate(files);
    }
  };

  const handleTogglePdfMovement = (fileIndex: number, movementIndex: number, movement: PDFMovementWithMatches, filename: string) => {
    const key = `${fileIndex}-${movementIndex}`;
    const newSelections = new Map(selectedPdfMovements);

    if (newSelections.has(key)) {
      newSelections.delete(key);
    } else if (movement.best_match) {
      newSelections.set(key, {
        fileIndex,
        movementIndex,
        tankId: movement.best_match.tank_id,
        type: movement.movement_type,
        volume: movement.extracted.movement_qty,
        date: movement.extracted.movement_date || new Date().toISOString().split('T')[0],
        notes: `Imported from PDF: ${filename}`,
      });
    }
    setSelectedPdfMovements(newSelections);
  };

  const handleChangeTank = (key: string, tankId: string, filename: string) => {
    const selection = selectedPdfMovements.get(key);
    if (selection) {
      setSelectedPdfMovements(new Map(selectedPdfMovements).set(key, {
        ...selection,
        tankId,
        notes: `Imported from PDF: ${filename}`,
      }));
    }
  };

  const handleImport = () => {
    const pdfMovements: PDFImportConfirmItem[] = Array.from(selectedPdfMovements.values()).map((s) => ({
      tank_id: s.tankId,
      type: s.type,
      volume: s.volume,
      date: s.date,
      notes: s.notes,
    }));
    importMutation.mutate({ movements: pdfMovements });
  };

  const handlePdfReset = () => {
    setPdfStep(0);
    setFiles([]);
    setExtractionResults([]);
    setSelectedPdfMovements(new Map());
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
    todayDate,
    searchQuery,
    statusFilter,
    typeFilter,
    sourceFilter,
  });

  const hasTransferTargets = transferTargets.length > 0;
  const tankOptions = tanks || [];

  // Build Map for O(1) movement lookups (used in actions column)
  const movementMap = useMemo(
    () => new Map(movements?.map((m) => [m.id, m]) || []),
    [movements]
  );

  // Stable handlers for column actions
  const handleEditClick = useCallback((movementId: string) => {
    const movement = movementMap.get(movementId);
    if (movement) handleOpenEdit(movement);
  }, [movementMap]);

  const handleCompleteClick = useCallback((movementId: string) => {
    const movement = movementMap.get(movementId);
    if (movement) handleOpenComplete(movement);
  }, [movementMap]);

  // Memoized columns definition
  const columns = useMemo<GridColDef[]>(() => [
    {
      field: 'date',
      headerName: 'Date',
      minWidth: 100,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => (
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {formatDate(
            params.row?.date
              ?? params.row?.scheduled_date
              ?? params.row?.created_at
          )}
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      minWidth: 100,
      flex: 0.6,
      renderCell: (params: GridRenderCellParams) => (
        <MovementTypeChip type={params.value as MovementType} />
      ),
      sortable: false,
    },
    {
      field: 'source',
      headerName: 'Source',
      minWidth: 80,
      flex: 0.5,
      renderCell: (params: GridRenderCellParams) => (
        <SourceBadge source={params.value as MovementSource} />
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as MovementGridRowExtended;
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

  // Manual Entry Form
  const renderManualEntryForm = () => (
    <Card sx={{
      background: styles.cardGradient,
      borderLeft: '2px solid var(--color-accent-cyan)',
      boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
    }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Schedule Operation
        </Typography>
        <ToggleButtonGroup
          value={formData.type}
          exclusive
          fullWidth
          onChange={(_, value) => {
            if (!value) return;
            setFormData({
              ...formData,
              type: value as MovementType,
              target_tank_id: '',
            });
            setTransferTargets([]);
          }}
          sx={{ mb: 2, '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'var(--color-border)' }, '& .Mui-selected': { color: 'var(--color-accent-cyan)', borderColor: 'var(--color-accent-cyan)' } }}
        >
          <ToggleButton value="load">Load</ToggleButton>
          <ToggleButton value="discharge">Discharge</ToggleButton>
          <ToggleButton value="transfer">Transfer</ToggleButton>
          <ToggleButton value="adjustment">Adjustment</ToggleButton>
        </ToggleButtonGroup>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>
              {formData.type === 'load' ? 'Target Tank' : 'Source Tank'}
            </InputLabel>
            <Select
              value={formData.tank_id}
              label={formData.type === 'load' ? 'Target Tank' : 'Source Tank'}
              onChange={(e) => setFormData({ ...formData, tank_id: e.target.value })}
            >
              {tanks?.map((tank) => (
                <MenuItem key={tank.id} value={tank.id}>
                  {tank.name} ({tank.current_level.toLocaleString()} bbl / {tank.capacity.toLocaleString()} bbl)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {formData.type === 'transfer' && formData.tank_id && (
            <Typography variant="caption" sx={{ color: remainingTransferVolume < 0 ? '#ff6b6b' : 'text.secondary' }}>
              Remaining after transfer: {remainingTransferVolume.toLocaleString()} bbl
            </Typography>
          )}

          {formData.type === 'transfer' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
                DESTINATION TANKS
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5, mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  Total volume: {totalTransferVolume.toLocaleString()} bbl
                </Typography>
                <Typography variant="caption" sx={{ color: remainingTransferVolume < 0 ? 'error.main' : 'text.secondary', fontSize: '0.65rem' }}>
                  Remaining: {remainingTransferVolume.toLocaleString()} bbl
                </Typography>
                {transferTargets.map((target, index) => {
                  const targetTank = tanks?.find((tank) => tank.id === target.tank_id);
                  return (
                    <Box key={`${target.tank_id}-${index}`} sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' }, alignItems: 'center' }}>
                      <FormControl size="small" fullWidth required>
                        <InputLabel>Target Tank</InputLabel>
                        <Select
                          value={target.tank_id}
                          label="Target Tank"
                          onChange={(e) => {
                            const nextTargets = [...transferTargets];
                            nextTargets[index] = { ...target, tank_id: e.target.value };
                            setTransferTargets(nextTargets);
                          }}
                        >
                          {targetTanks.map((tank) => (
                            <MenuItem key={tank.id} value={tank.id}>
                              {tank.name} ({tank.current_level.toLocaleString()} bbl / {tank.capacity.toLocaleString()} bbl)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                        <TextField
                          size="small"
                          label="Volume (bbl)"
                          type="number"
                          value={target.volume || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const nextTargets = [...transferTargets];
                            nextTargets[index] = { ...target, volume: value === '' ? 0 : Number(value) };
                            setTransferTargets(nextTargets);
                          }}
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        />

                      <Button
                        variant="text"
                        sx={{ color: 'text.secondary' }}
                        onClick={() => {
                          const nextTargets = transferTargets.filter((_, idx) => idx !== index);
                          setTransferTargets(nextTargets);
                        }}
                      >
                        Remove
                      </Button>
                      {targetTank && (
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', gridColumn: { xs: '1', sm: '1 / span 3' } }}>
                          {targetTank.name} available: {targetTank.current_level.toLocaleString()} bbl
                        </Typography>
                      )}
                    </Box>
                  );
                })}
                <Button
                  variant="outlined"
                  size="small"
                  disabled={availableTargetTanks.length === 0}
                  onClick={() => setTransferTargets((prev) => ([
                    ...prev,
                    { tank_id: availableTargetTanks[0]?.id || '', volume: 0 }
                  ]))}
                  sx={{
                    alignSelf: 'flex-start',
                    borderColor: 'var(--color-accent-cyan)',
                    color: 'var(--color-accent-cyan)',
                  }}
                >
                  Add Target
                </Button>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Scheduled Date"
            type="date"
            required
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {formData.type !== 'transfer' && (
          <TextField
            fullWidth
            margin="normal"
            label="Expected Volume (bbl)"
            type="number"
            required
            value={formData.expected_volume || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, expected_volume: value === '' ? 0 : Number(value) });
            }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />

          )}

          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid var(--color-accent-cyan)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
            disabled={!formData.tank_id || createMutation.isPending || transferMutation.isPending || (formData.type !== 'transfer' && formData.expected_volume <= 0) || (formData.type === 'transfer' && !hasTransferTargets)}
          >
            {createMutation.isPending ? 'Initializing…' : 'Execute Operation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // PDF Import Upload Step
  const renderPdfUploadStep = () => (
    <Box sx={{ mt: 2 }}>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'var(--color-border)',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: dragActive ? 'rgba(0, 212, 255, 0.05)' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('pdf-file-input')?.click()}
      >
        <input
          id="pdf-file-input"
          type="file"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'var(--color-accent-cyan)', mb: 1 }} />
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Drag & drop PDF files here
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          or click to select files
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem' }}>
            SELECTED FILES ({files.length})
          </Typography>
          <Box sx={{ mt: 1 }}>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 0.5,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont }}>
                    {file.name}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  sx={{ color: 'error.main', minWidth: 'auto', fontSize: '0.65rem' }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={handleExtract}
          disabled={files.length === 0 || extractMutation.isPending}
          startIcon={extractMutation.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {extractMutation.isPending ? 'Extracting...' : 'Extract Data'}
        </Button>
      </Box>

      {extractMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {extractMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  // PDF Import Review Step
  const renderPdfReviewStep = () => (
    <Box sx={{ mt: 2 }}>
      {extractionResults.map((result, fileIndex) => (
        <Box key={fileIndex} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.65rem', mb: 1, display: 'block' }}>
            {result.filename}
          </Typography>

          {result.extraction_errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
              {result.extraction_errors.join(', ')}
            </Alert>
          )}

          {result.movements.length > 0 ? (
            <TableContainer sx={{ border: '1px solid var(--glass-border)', bgcolor: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={styles.tableHeadRow}>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontSize: '0.7rem' }}>Tank</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Match To</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem' }}>Volume</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Type</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.movements.map((movement, movementIndex) => {
                    const key = `${fileIndex}-${movementIndex}`;
                    const isSelected = selectedPdfMovements.has(key);
                    const selection = selectedPdfMovements.get(key);
                    const typeColor = movementTypeColors[movement.movement_type];
                    const chipColor = movementTypeChipColors[typeColor];
                    const suggestedMatchIds = new Set(
                      movement.suggested_matches.map((match) => match.tank_id)
                    );
                    const extraTankOptions = tankOptions.filter(
                      (tank) => !suggestedMatchIds.has(tank.id)
                    );

                    return (
                      <TableRow
                        key={movementIndex}
                        sx={{
                          opacity: isSelected ? 1 : 0.6,
                          '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.06)' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleTogglePdfMovement(fileIndex, movementIndex, movement, result.filename)}
                            disabled={movement.suggested_matches.length === 0}
                            sx={{
                              color: 'var(--color-border)',
                              '&.Mui-checked': { color: 'var(--color-accent-cyan)' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont }}>
                            {movement.extracted.tank_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {movement.suggested_matches.length > 0 ? (
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <Select
                                value={selection?.tankId || movement.best_match?.tank_id || ''}
                                onChange={(e) => {
                                  if (!isSelected && movement.best_match) {
                                    handleTogglePdfMovement(fileIndex, movementIndex, movement, result.filename);
                                  }
                                  handleChangeTank(key, e.target.value, result.filename);
                                }}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {movement.suggested_matches.map((match) => (
                                  <MenuItem key={match.tank_id} value={match.tank_id}>
                                    {match.tank_name} ({match.confidence}%)
                                  </MenuItem>
                                ))}
                                {extraTankOptions.map((tank) => (
                                  <MenuItem key={tank.id} value={tank.id}>
                                    {tank.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                              No match
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont, fontWeight: 600 }}>
                            {movement.extracted.movement_qty.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: '6px',
                              bgcolor: chipColor.bg,
                              color: chipColor.text,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {movementTypeLabels[movement.movement_type]}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {movement.best_match && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {movement.is_exact_match ? (
                                <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              ) : (
                                <ErrorOutlineIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                              )}
                              <Typography sx={{ fontSize: '0.7rem', color: movement.is_exact_match ? 'success.main' : 'warning.main' }}>
                                {movement.best_match.confidence}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              No movements extracted from this file.
            </Typography>
          )}
        </Box>
      ))}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handlePdfReset} sx={{ color: 'text.secondary' }}>
          Start Over
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={selectedPdfMovements.size === 0 || importMutation.isPending}
          startIcon={importMutation.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {importMutation.isPending ? 'Importing...' : `Import ${selectedPdfMovements.size} Movement${selectedPdfMovements.size !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {importMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {importMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  // PDF Import Confirm Step
  const renderPdfConfirmStep = () => (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Import Complete
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: '0.85rem' }}>
        Successfully created {selectedPdfMovements.size} movement{selectedPdfMovements.size !== 1 ? 's' : ''}.
      </Typography>
      <Button
        variant="contained"
        onClick={handlePdfReset}
        sx={{
          bgcolor: 'rgba(0, 212, 255, 0.1)',
          color: 'var(--color-accent-cyan)',
          border: '1px solid var(--color-accent-cyan)',
          '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
        }}
      >
        Import More
      </Button>
    </Box>
  );

  // PDF Import Form (with stepper)
  const renderPdfImportForm = () => (
    <Card sx={{
      background: styles.cardGradient,
      borderLeft: '2px solid #a78bfa',
      boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
    }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Import from PDF
        </Typography>

        <Stepper activeStep={pdfStep} sx={{ mb: 2 }}>
          {pdfImportSteps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.65rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  },
                  '& .MuiStepIcon-root.Mui-active': {
                    color: '#a78bfa',
                  },
                  '& .MuiStepIcon-root.Mui-completed': {
                    color: 'success.main',
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {pdfStep === 0 && renderPdfUploadStep()}
        {pdfStep === 1 && renderPdfReviewStep()}
        {pdfStep === 2 && renderPdfConfirmStep()}
      </CardContent>
    </Card>
  );

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
          {/* Tabs for Manual Entry vs PDF Import */}
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

          {activeTab === 0 && renderManualEntryForm()}
          {activeTab === 1 && renderPdfImportForm()}
        </Grid>

        <MovementsTableSection
          rows={rows}
          columns={columns}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          editData={editData}
          onEditDataChange={setEditData}
          onBulkComplete={handleBulkComplete}
          onBulkReschedule={handleBulkReschedule}
        />
      </Grid>

      {/* Complete Movement Dialog */}
      <GlassDialog
        open={completeDialogOpen}
        onClose={resetCompleteState}
        maxWidth="sm"
        fullWidth
        title="CONFIRM OPERATION"
        actions={
          <>
            <Button onClick={() => setCompleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>Abort</Button>
            <Button
              onClick={handleComplete}
              variant="contained"
              disabled={actualVolume <= 0 || completeMutation.isPending}
              sx={{
                bgcolor: 'rgba(0, 230, 118, 0.1)',
                color: '#00e676',
                border: '1px solid #00e676',
                '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
                '&:disabled': { opacity: 0.3 }
              }}
            >
              {completeMutation.isPending ? 'Processing…' : 'Confirm'}
            </Button>
          </>
        }
      >
        {selectedMovement && (
          <Box>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>TARGET TANK</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>{selectedMovement.tank_id ? tankMap.get(selectedMovement.tank_id)?.name : 'Unassigned'}</Typography>
            </Box>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>EXPECTED VOLUME</Typography>
              <Typography sx={{ color: 'var(--color-accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{selectedMovement.expected_volume.toLocaleString()} bbl</Typography>
            </Box>
            <TextField
              fullWidth
              margin="normal"
              label="Actual Volume (bbl)"
              type="number"
              required
              value={actualVolume || ''}
              onChange={(e) => {
                const value = e.target.value;
                setActualVolume(value === '' ? 0 : Number(value));
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              autoFocus
            />
          </Box>
        )}
      </GlassDialog>

      {/* Edit Movement Dialog */}
      <GlassDialog
        open={editDialogOpen}
        onClose={resetEditState}
        maxWidth="sm"
        fullWidth
        title="EDIT OPERATION"
        titleColor="#ffab00"
        actions={
          <>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              variant="contained"
              disabled={updateMutation.isPending}
              sx={{
                bgcolor: 'rgba(255, 171, 0, 0.1)',
                color: '#ffab00',
                border: '1px solid #ffab00',
                '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
                '&:disabled': { opacity: 0.3 },
              }}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {selectedMovement && (
          <Box>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                TARGET TANK
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {selectedMovement.tank_id ? tankMap.get(selectedMovement.tank_id)?.name : 'Unassigned'}
              </Typography>
            </Box>
            <TextField
              fullWidth
              margin="normal"
              label="Scheduled Date"
              type="date"
              value={editData.scheduled_date || ''}
              onChange={(e) => setEditData({ ...editData, scheduled_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Expected Volume (bbl)"
              type="number"
              value={editData.expected_volume || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditData({ ...editData, expected_volume: value === '' ? undefined : Number(value) });
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              multiline
              rows={2}
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            />
          </Box>
        )}
      </GlassDialog>
    </Box>
  );
}
