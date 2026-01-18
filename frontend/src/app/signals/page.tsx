'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { movementsApi, tanksApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import type { Movement, SignalAssignment, TankWithLevel, TradeInfoUpdate } from '@/lib/types';

interface SignalGridRow {
  id: string;
  signal_id: string;
  source_tank: string;
  load_date: string;
  volume: number;
  tank_id: string | null;
  tank_name: string | null;
  trade_number: string | null;
  trade_line_item: string | null;
}

export default function SignalsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      setSuccessMessage(`Added ${result.created_count} new signal(s)${skippedMsg}`);
      setError(null);
      if (result.errors.length > 0) {
        setError(`Warnings: ${result.errors.join(', ')}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccessMessage(null);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SignalAssignment }) =>
      movementsApi.assignSignal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      invalidateCommonQueries(queryClient);
      setSuccessMessage('Signal assigned successfully');
      setError(null);
      handleCloseAssignDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const tradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TradeInfoUpdate }) =>
      movementsApi.updateTradeInfo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      invalidateCommonQueries(queryClient);
      setSuccessMessage('Trade information updated');
      setError(null);
      handleCloseTradeDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
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

  const handleOpenAssignDialog = (signal: Movement) => {
    setSelectedSignal(signal);
    setAssignmentData({
      tank_id: '',
      expected_volume: signal.expected_volume,
      scheduled_date: signal.scheduled_date,
      notes: signal.notes || '',
    });
    setAssignDialogOpen(true);
  };

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

  const handleOpenTradeDialog = (signal: Movement) => {
    setSelectedTradeSignal(signal);
    setTradeData({
      trade_number: signal.trade_number || '',
      trade_line_item: signal.trade_line_item || '',
    });
    setTradeDialogOpen(true);
  };

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

  const rows: SignalGridRow[] = (signals || []).map((signal) => {
    const tank = signal.tank_id ? tanks?.find((t) => t.id === signal.tank_id) : null;
    return {
      id: signal.id,
      signal_id: signal.signal_id || 'N/A',
      source_tank: signal.source_tank || 'Unknown',
      load_date: signal.scheduled_date,
      volume: signal.expected_volume,
      tank_id: signal.tank_id,
      tank_name: tank?.name || null,
      trade_number: signal.trade_number || null,
      trade_line_item: signal.trade_line_item || null,
    };
  });

  const columns: GridColDef[] = [
    {
      field: 'signal_id',
      headerName: 'Signal ID',
      minWidth: 120,
      flex: 0.9,
      renderCell: (params: GridRenderCellParams) => (
        <Typography sx={{ fontWeight: 600, color: 'var(--color-accent-cyan)' }} noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'source_tank',
      headerName: 'Refinery Tank',
      minWidth: 120,
      flex: 0.9,
    },
    {
      field: 'load_date',
      headerName: 'Date',
      minWidth: 90,
      flex: 0.7,
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => {
        const signal = signals?.find((s) => s.id === params.row.id);
        if (!signal) return null;
        const isAssigned = signal.tank_id !== null;
        const hasTrade = signal.trade_number && signal.trade_line_item;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isAssigned && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                onClick={() => handleOpenAssignDialog(signal)}
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
                onClick={() => handleOpenTradeDialog(signal)}
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
  ];

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
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            PENDING SIGNALS
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
            {signals?.length || 0}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            TOTAL VOLUME
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>
            {(signals?.reduce((sum, s) => sum + s.expected_volume, 0) || 0).toLocaleString()} bbl
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
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

              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)' }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {successMessage && (
                <Alert
                  severity="success"
                  sx={{ mb: 2, bgcolor: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)' }}
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              )}

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
                sx={{
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(10, 15, 26, 0.9)',
                  borderRadius: '12px',
                  '& .MuiDataGrid-columnHeaders': {
                    borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                    backgroundColor: 'rgba(0, 229, 255, 0.08)',
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
                    minWidth: 0,
                    overflow: 'hidden',
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
                    color: 'inherit',
                  },
                  '& .MuiDataGrid-row': {
                    '&:nth-of-type(even)': {
                      backgroundColor: alpha('#00e5ff', 0.02),
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
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(18, 26, 39, 0.95)',
              boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
              backdropFilter: 'blur(18px)',
            },
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em' }}>
            ASSIGN SIGNAL
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
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
                    <Typography sx={{ fontSize: '0.85rem' }}>{selectedSignal.source_tank}</Typography>
                  </Box>
                </Box>
              </Box>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Destination Tank</InputLabel>
                <Select
                  value={assignmentData.tank_id}
                  label="Destination Tank"
                  onChange={(e) => setAssignmentData({ ...assignmentData, tank_id: e.target.value })}
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
                  setAssignmentData({
                    ...assignmentData,
                    expected_volume: value === '' ? 0 : Number(value),
                  });
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
                onChange={(e) => setAssignmentData({ ...assignmentData, scheduled_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Notes"
                multiline
                rows={2}
                value={assignmentData.notes || ''}
                onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
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
        </DialogActions>
      </Dialog>

      {/* Trade Info Dialog */}
      <Dialog
        open={tradeDialogOpen}
        onClose={handleCloseTradeDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(18, 26, 39, 0.95)',
              boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
              backdropFilter: 'blur(18px)',
            },
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
          <Typography variant="overline" sx={{ color: '#8b5cf6', fontWeight: 700, letterSpacing: '0.15em' }}>
            EDIT TRADE INFO
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
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
                    <Typography sx={{ fontSize: '0.85rem' }}>{selectedTradeSignal.source_tank}</Typography>
                  </Box>
                </Box>
              </Box>

              <TextField
                fullWidth
                margin="normal"
                label="Trade Number"
                required
                value={tradeData.trade_number}
                onChange={(e) => setTradeData({ ...tradeData, trade_number: e.target.value })}
                placeholder="e.g., TR-123"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Trade Line Item"
                required
                value={tradeData.trade_line_item}
                onChange={(e) => setTradeData({ ...tradeData, trade_line_item: e.target.value })}
                placeholder="e.g., 01"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}
