'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { movementsApi, tanksApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles, dataGridWithRowStylesSx } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import { useToast } from '@/contexts/ToastContext';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import GlassDialog from '@/components/GlassDialog';
import type { Movement, SignalAssignment, TankWithLevel, TradeInfoUpdate, SignalGridRow } from '@/lib/types';

export default function SignalsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Movement | null>(null);
  const [assignmentData, setAssignmentData] = useState<SignalAssignment>({
    tank_id: '',
    expected_volume: 0,
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedTradeSignal, setSelectedTradeSignal] = useState<Movement | null>(null);
  const [tradeData, setTradeData] = useState<TradeInfoUpdate>({
    trade_number: '',
    trade_line_item: '',
  });

  const { data: signals, isLoading: signalsLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: () => movementsApi.getSignals(),
  });

  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => movementsApi.uploadSignals(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      invalidateCommonQueries(queryClient);
      const skippedMsg = result.skipped_count > 0 ? ` (${result.skipped_count} already existed)` : '';
      showSuccess(`Added ${result.created_count} new signal(s)${skippedMsg}`);
      if (result.errors.length > 0) {
        showWarning(`Warnings: ${result.errors.join(', ')}`);
      }
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SignalAssignment }) =>
      movementsApi.assignSignal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      invalidateCommonQueries(queryClient);
      showSuccess('Signal assigned successfully');
      handleCloseAssignDialog();
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const tradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TradeInfoUpdate }) =>
      movementsApi.updateTradeInfo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      invalidateCommonQueries(queryClient);
      showSuccess('Trade information updated');
      handleCloseTradeDialog();
    },
    onError: (err: Error) => {
      showError(err.message);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAssignDialog = useCallback((signal: Movement) => {
    setSelectedSignal(signal);
    setAssignmentData({
      tank_id: '',
      expected_volume: signal.expected_volume,
      scheduled_date: signal.scheduled_date,
      notes: signal.notes || '',
    });
    setAssignDialogOpen(true);
  }, []);

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedSignal(null);
    setAssignmentData({
      tank_id: '',
      expected_volume: 0,
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleAssign = () => {
    if (!selectedSignal || !assignmentData.tank_id) return;
    assignMutation.mutate({ id: selectedSignal.id, data: assignmentData });
  };

  const handleOpenTradeDialog = useCallback((signal: Movement) => {
    setSelectedTradeSignal(signal);
    setTradeData({
      trade_number: signal.trade_number || '',
      trade_line_item: signal.trade_line_item || '',
    });
    setTradeDialogOpen(true);
  }, []);

  const handleCloseTradeDialog = () => {
    setTradeDialogOpen(false);
    setSelectedTradeSignal(null);
    setTradeData({
      trade_number: '',
      trade_line_item: '',
    });
  };

  const handleSaveTrade = () => {
    if (!selectedTradeSignal || !tradeData.trade_number || !tradeData.trade_line_item) return;
    tradeMutation.mutate({ id: selectedTradeSignal.id, data: tradeData });
  };

  const isLoading = signalsLoading || tanksLoading;

  // Build Map for O(1) tank lookups
  const tankMap = useMemo(
    () => new Map(tanks?.map((tank) => [tank.id, tank]) || []),
    [tanks]
  );

  // Build Map for O(1) signal lookups (used in actions column)
  const signalMap = useMemo(
    () => new Map(signals?.map((signal) => [signal.id, signal]) || []),
    [signals]
  );

  const rows = useMemo<SignalGridRow[]>(() => (
    (signals || []).map((signal) => {
      const tank = signal.tank_id ? tankMap.get(signal.tank_id) : null;
      return {
        id: signal.id,
        signal_id: signal.signal_id || 'N/A',
        refinery_tank_name: signal.refinery_tank_name || 'Unknown',
        load_date: signal.scheduled_date,
        volume: signal.expected_volume,
        tank_id: signal.tank_id,
        tank_name: tank?.name || null,
        trade_number: signal.trade_number || null,
        trade_line_item: signal.trade_line_item || null,
      };
    })
  ), [signals, tankMap]);

  // Stable handlers for column actions
  const handleAssignClick = useCallback((signalId: string) => {
    const signal = signalMap.get(signalId);
    if (signal) handleOpenAssignDialog(signal);
  }, [signalMap, handleOpenAssignDialog]);

  const handleTradeClick = useCallback((signalId: string) => {
    const signal = signalMap.get(signalId);
    if (signal) handleOpenTradeDialog(signal);
  }, [signalMap, handleOpenTradeDialog]);

  const columns = useMemo<GridColDef<SignalGridRow>[]>(() => [
    {
      field: 'signal_id',
      headerName: 'Signal ID',
      minWidth: 120,
      flex: 0.9,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, color: 'var(--color-accent-cyan)' }} noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'refinery_tank_name',
      headerName: 'Refinery Tank',
      minWidth: 120,
      flex: 0.9,
    },
    {
      field: 'load_date',
      headerName: 'Date',
      minWidth: 90,
      flex: 0.7,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'volume',
      headerName: 'Volume',
      minWidth: 100,
      flex: 0.7,
      type: 'number',
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'tank_name',
      headerName: 'Tank',
      minWidth: 100,
      flex: 0.8,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: params.value ? 600 : 400,
            color: params.value ? '#00e676' : 'text.disabled',
          }}
          noWrap
        >
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'trade_number',
      headerName: 'Trade #',
      minWidth: 90,
      flex: 0.7,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: params.value ? 600 : 400,
            color: params.value ? '#8b5cf6' : 'text.disabled',
          }}
          noWrap
        >
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'trade_line_item',
      headerName: 'Line',
      minWidth: 70,
      flex: 0.5,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: params.value ? 600 : 400,
            color: params.value ? '#8b5cf6' : 'text.disabled',
          }}
          noWrap
        >
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      minWidth: 180,
      renderCell: (params) => {
        const { row } = params;
        const isAssigned = row.tank_id !== null;
        const hasTrade = row.trade_number && row.trade_line_item;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isAssigned && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                onClick={() => handleAssignClick(row.id)}
                sx={{
                  borderColor: 'var(--color-accent-cyan)',
                  color: 'var(--color-accent-cyan)',
                  fontSize: '0.65rem',
                  py: 0.3,
                  px: 1,
                  '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.1)' },
                }}
              >
                Assign
              </Button>
            )}
            {!hasTrade && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                onClick={() => handleTradeClick(row.id)}
                sx={{
                  borderColor: '#8b5cf6',
                  color: '#8b5cf6',
                  fontSize: '0.65rem',
                  py: 0.3,
                  px: 1,
                  '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
                }}
              >
                Trade
              </Button>
            )}
          </Box>
        );
      },
    },
  ], [handleAssignClick, handleTradeClick]);

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
        <Typography
          variant="overline"
          sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}
        >
          Refinery Signals
        </Typography>
        <Box
          sx={{ width: 60, height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.35)' }}
        />
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            PENDING SIGNALS
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
            {signals?.length || 0}
          </Typography>
        </Box>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            TOTAL VOLUME
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>
            {(signals?.reduce((sum, s) => sum + s.expected_volume, 0) || 0).toLocaleString()} bbl
          </Typography>
        </Box>
        <Box sx={styles.summaryCard}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            AVAILABLE TANKS
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#00e676' }}>
            {tanks?.length || 0}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              background: styles.cardGradient,
              borderLeft: '2px solid var(--color-accent-cyan)',
              boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
            }}
          >
            <CardContent>
              <Typography
                variant="overline"
                sx={{
                  color: 'var(--color-accent-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  fontSize: '0.65rem',
                  mb: 2,
                  display: 'block',
                }}
              >
                Upload Signals
              </Typography>

              <Box
                sx={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: '12px',
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'var(--color-accent-cyan)',
                    bgcolor: 'rgba(0, 229, 255, 0.05)',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'var(--color-accent-cyan)', mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Click to upload Excel file
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  .xlsx files only
                </Typography>
              </Box>

              {uploadMutation.isPending && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={20} sx={{ color: 'var(--color-accent-cyan)' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Processing file...
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Expected columns:
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                  Signal ID, Load Date, Refinery Tank, Volume
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Signals Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <SectionHeader title="Pending Signals" />
          </Box>

          {rows.length === 0 ? (
            <EmptyState
              icon={<AssignmentIcon />}
              title="All Signals Complete"
              description="All signals have been assigned and have trade info. Upload more signals to continue."
              action={{
                label: 'Upload Signals',
                onClick: () => fileInputRef.current?.click()
              }}
            />
          ) : (
            <Box sx={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 20, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                sx={dataGridWithRowStylesSx}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <GlassDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        maxWidth="sm"
        fullWidth
        title="ASSIGN SIGNAL"
        actions={
          <>
            <Button onClick={handleCloseAssignDialog} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              variant="contained"
              disabled={!assignmentData.tank_id || assignmentData.expected_volume <= 0 || assignMutation.isPending}
              sx={{
                bgcolor: 'rgba(0, 230, 118, 0.1)',
                color: '#00e676',
                border: '1px solid #00e676',
                '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
                '&:disabled': { opacity: 0.3 },
              }}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </>
        }
      >
        {selectedSignal && (
          <Box>
            <Box sx={{ mb: 2.5, p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    SIGNAL ID
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', fontWeight: 600 }}>
                    {selectedSignal.signal_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    REFINERY TANK
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{selectedSignal.refinery_tank_name}</Typography>
                </Box>
              </Box>
            </Box>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Destination Tank</InputLabel>
              <Select
                value={assignmentData.tank_id}
                label="Destination Tank"
                onChange={(e) => setAssignmentData(prev => ({ ...prev, tank_id: e.target.value }))}
              >
                {tanks?.map((tank: TankWithLevel) => (
                  <MenuItem key={tank.id} value={tank.id}>
                    {tank.name} ({tank.current_level.toLocaleString()} / {tank.capacity.toLocaleString()} bbl)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Expected Volume (bbl)"
              type="number"
              required
              value={assignmentData.expected_volume || ''}
              onChange={(e) => {
                const value = e.target.value;
                setAssignmentData(prev => ({
                  ...prev,
                  expected_volume: value === '' ? 0 : Number(value),
                }));
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Scheduled Date"
              type="date"
              required
              value={assignmentData.scheduled_date}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              multiline
              rows={2}
              value={assignmentData.notes || ''}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        )}
      </GlassDialog>

      {/* Trade Info Dialog */}
      <GlassDialog
        open={tradeDialogOpen}
        onClose={handleCloseTradeDialog}
        maxWidth="sm"
        fullWidth
        title="EDIT TRADE INFO"
        titleColor="#8b5cf6"
        actions={
          <>
            <Button onClick={handleCloseTradeDialog} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTrade}
              variant="contained"
              disabled={!tradeData.trade_number || !tradeData.trade_line_item || tradeMutation.isPending}
              sx={{
                bgcolor: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                border: '1px solid #8b5cf6',
                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)' },
                '&:disabled': { opacity: 0.3 },
              }}
            >
              {tradeMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        {selectedTradeSignal && (
          <Box>
            <Box sx={{ mb: 2.5, p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    SIGNAL ID
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', fontWeight: 600 }}>
                    {selectedTradeSignal.signal_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    REFINERY TANK
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{selectedTradeSignal.refinery_tank_name}</Typography>
                </Box>
              </Box>
            </Box>

            <TextField
              fullWidth
              margin="normal"
              label="Trade Number"
              required
              value={tradeData.trade_number}
              onChange={(e) => setTradeData(prev => ({ ...prev, trade_number: e.target.value }))}
              placeholder="e.g., TR-123"
            />

            <TextField
              fullWidth
              margin="normal"
              label="Trade Line Item"
              required
              value={tradeData.trade_line_item}
              onChange={(e) => setTradeData(prev => ({ ...prev, trade_line_item: e.target.value }))}
              placeholder="e.g., 01"
            />
          </Box>
        )}
      </GlassDialog>
    </Box>
  );
}
