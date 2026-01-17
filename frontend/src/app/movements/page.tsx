'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { movementsApi, tanksApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles } from '@/lib/constants';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import type { MovementCreate, Movement, MovementType, MovementUpdate } from '@/lib/types';

export default function MovementsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [actualVolume, setActualVolume] = useState<number>(0);
  const [editData, setEditData] = useState<MovementUpdate>({});

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<MovementCreate>({
    type: 'load',
    tank_id: '',
    target_tank_id: '',
    expected_volume: 0,
    scheduled_date: today,
    notes: '',
  });

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
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, actual_volume }: { id: string; actual_volume: number }) =>
      movementsApi.complete(id, { actual_volume }),
    onSuccess: () => {
      invalidateCommonQueries(queryClient);
      setCompleteDialogOpen(false);
      setSelectedMovement(null);
      setActualVolume(0);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MovementUpdate }) =>
      movementsApi.update(id, data),
    onSuccess: () => {
      invalidateCommonQueries(queryClient);
      setEditDialogOpen(false);
      setSelectedMovement(null);
      setEditData({});
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tank_id || formData.expected_volume <= 0) return;
    if (formData.type === 'transfer' && !formData.target_tank_id) return;

    createMutation.mutate(formData);
  };

  const handleOpenComplete = (movement: Movement) => {
    setSelectedMovement(movement);
    setActualVolume(movement.expected_volume);
    setCompleteDialogOpen(true);
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

  const isLoading = movementsLoading || tanksLoading;

  const tankMap = useMemo(() => new Map(tanks?.map((t) => [t.id, t]) || []), [tanks]);

  // Filter tanks for transfer target (exclude source tank)
  const targetTanks = useMemo(() => (
    tanks?.filter((t) => t.id !== formData.tank_id) || []
  ), [tanks, formData.tank_id]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tactical Command Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          FUEL OPERATIONS
        </Typography>
        <Box sx={{ width: 60, height: '1px', background: 'linear-gradient(90deg, var(--color-accent-cyan) 0%, transparent 100%)' }} />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{
            background: styles.cardGradient,
            borderLeft: '2px solid var(--color-accent-cyan)',
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
                SCHEDULE OPERATION
              </Typography>
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)' }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <FormControl fullWidth margin="normal">
                  <InputLabel>Movement Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Movement Type"
                    onChange={(e) => setFormData({
                      ...formData,
                      type: e.target.value as MovementType,
                      target_tank_id: '',
                    })}
                  >
                    <MenuItem value="load">Load (Add fuel to tank)</MenuItem>
                    <MenuItem value="discharge">Discharge (Remove fuel from tank)</MenuItem>
                    <MenuItem value="transfer">Transfer (Move between tanks)</MenuItem>
                  </Select>
                </FormControl>

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
                        {tank.name} ({tank.current_level.toLocaleString()}L / {tank.capacity.toLocaleString()}L)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {formData.type === 'transfer' && (
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Destination Tank</InputLabel>
                    <Select
                      value={formData.target_tank_id}
                      label="Destination Tank"
                      onChange={(e) => setFormData({ ...formData, target_tank_id: e.target.value })}
                    >
                      {targetTanks.map((tank) => (
                        <MenuItem key={tank.id} value={tank.id}>
                          {tank.name} ({tank.current_level.toLocaleString()}L / {tank.capacity.toLocaleString()}L)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

                <TextField
                  fullWidth
                  margin="normal"
                  label="Expected Volume (Liters)"
                  type="number"
                  required
                  value={formData.expected_volume || ''}
                  onChange={(e) => setFormData({ ...formData, expected_volume: Number(e.target.value) })}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />

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
                  disabled={!formData.tank_id || formData.expected_volume <= 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? 'INITIALIZING...' : 'EXECUTE OPERATION'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {/* Movement Log Header */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader title="OPERATION LOG" />
          </Box>

          <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid var(--color-border)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={styles.tableHeadRow}>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Expected</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      NO OPERATIONS SCHEDULED
                    </TableCell>
                  </TableRow>
                ) : (
                  movements?.slice(0, 20).map((movement) => {
                    const tank = tankMap.get(movement.tank_id);
                    const targetTank = movement.target_tank_id ? tankMap.get(movement.target_tank_id) : null;
                    const isPending = movement.actual_volume === null;
                    return (
                      <TableRow key={movement.id} sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem' } }}>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {new Date(movement.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <MovementTypeChip type={movement.type} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {tank?.name || 'Unknown'}
                          {targetTank && <span style={{ color: 'var(--color-accent-cyan)' }}> → {targetTank.name}</span>}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {movement.expected_volume.toLocaleString()} L
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: isPending ? 'text.disabled' : 'text.primary' }}>
                          {movement.actual_volume !== null
                            ? `${movement.actual_volume.toLocaleString()} L`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <MovementStatus isPending={isPending} />
                        </TableCell>
                        <TableCell>
                          {isPending && movement.type !== 'adjustment' && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(movement)}
                                title="Edit movement"
                                sx={{ color: '#ffab00', '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.1)' } }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenComplete(movement)}
                                title="Complete movement"
                                sx={{ color: 'var(--color-accent-cyan)', '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.1)' } }}
                              >
                                <CheckCircleIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Complete Movement Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid var(--color-border)',
              backgroundImage: 'none'
            }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em' }}>
            CONFIRM OPERATION
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedMovement && (
            <Box>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>TARGET UNIT</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{tankMap.get(selectedMovement.tank_id)?.name}</Typography>
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>EXPECTED VOLUME</Typography>
                <Typography sx={{ fontFamily: 'monospace', color: 'var(--color-accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{selectedMovement.expected_volume.toLocaleString()} L</Typography>
              </Box>
              <TextField
                fullWidth
                margin="normal"
                label="Actual Volume (Liters)"
                type="number"
                required
                value={actualVolume || ''}
                onChange={(e) => setActualVolume(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                autoFocus
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
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
            {completeMutation.isPending ? 'PROCESSING...' : 'CONFIRM'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Movement Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid var(--color-border)',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
          <Typography variant="overline" sx={{ color: '#ffab00', fontWeight: 700, letterSpacing: '0.15em' }}>
            EDIT OPERATION
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedMovement && (
            <Box>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                  TARGET UNIT
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {tankMap.get(selectedMovement.tank_id)?.name}
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
                label="Expected Volume (Liters)"
                type="number"
                value={editData.expected_volume || ''}
                onChange={(e) => setEditData({ ...editData, expected_volume: Number(e.target.value) })}
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
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
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
            {updateMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
