'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
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
import { movementsApi, tanksApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import TankLevelGauge from '@/components/TankLevelGauge';
import SectionHeader from '@/components/SectionHeader';
import type { AdjustmentCreate, TankWithLevel } from '@/lib/types';

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [physicalLevel, setPhysicalLevel] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', 'adjustment'],
    queryFn: () => movementsApi.getAll(undefined, 'adjustment'),
  });

  const createMutation = useMutation({
    mutationFn: movementsApi.createAdjustment,
    onSuccess: (data) => {
      invalidateCommonQueries(queryClient);
      setPhysicalLevel(0);
      setNotes('');
      setSelectedTankId('');
      setError(null);
      setSuccess(`Adjustment recorded: ${(data.actual_volume ?? 0) >= 0 ? '+' : ''}${(data.actual_volume ?? 0).toLocaleString()} bbl`);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTankId || physicalLevel < 0) return;

    const adjustmentData: AdjustmentCreate = {
      tank_id: selectedTankId,
      physical_level: physicalLevel,
      notes: notes || undefined,
    };

    createMutation.mutate(adjustmentData);
  };

  const selectedTank: TankWithLevel | undefined = useMemo(
    () => tanks?.find((t) => t.id === selectedTankId),
    [tanks, selectedTankId]
  );
  const difference = useMemo(
    () => (selectedTank ? physicalLevel - selectedTank.current_level : 0),
    [physicalLevel, selectedTank]
  );

  const tankMap = useMemo(() => new Map(tanks?.map((t) => [t.id, t]) || []), [tanks]);

  if (tanksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tactical Command Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          CALIBRATION PROTOCOL
        </Typography>
        <Box sx={{ width: 60, height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.35)' }} />
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontSize: '0.75rem' }}>
        RECONCILE PHYSICAL READINGS WITH CALCULATED SYSTEM LEVELS
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{
            background: styles.cardGradient,
            borderLeft: '2px solid #ffb300',
            boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: '#ffab00', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
                PHYSICAL READING INPUT
              </Typography>
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)' }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2, bgcolor: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)' }} onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Select Tank</InputLabel>
                  <Select
                    value={selectedTankId}
                    label="Select Tank"
                    onChange={(e) => {
                      setSelectedTankId(e.target.value);
                      const tank = tanks?.find((t) => t.id === e.target.value);
                      if (tank) {
                        setPhysicalLevel(tank.current_level);
                      }
                    }}
                  >
                    {tanks?.map((tank) => (
                      <MenuItem key={tank.id} value={tank.id}>
                        {tank.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedTank && (
                  <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(0, 212, 255, 0.05)', border: '1px solid var(--color-border)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'block', mb: 1 }}>
                      CALCULATED SYSTEM LEVEL
                    </Typography>
                    <Typography sx={{ color: 'var(--color-accent-cyan)', fontSize: '1.25rem', fontWeight: 600 }}>
                      {selectedTank.current_level.toLocaleString()} bbl
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <TankLevelGauge
                        percentage={selectedTank.level_percentage}
                      />
                    </Box>
                  </Box>
                )}

                <TextField
                  fullWidth
                  margin="normal"
                  label="Physical Level (bbl)"
                  type="number"
                  required
                  value={physicalLevel || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPhysicalLevel(value === '' ? 0 : Number(value));
                  }}
                  slotProps={{ htmlInput: { min: 0, max: selectedTank?.capacity, step: 0.01 } }}
                  helperText={selectedTank ? `Max: ${selectedTank.capacity.toLocaleString()} bbl` : ''}
                />

                {selectedTank && physicalLevel >= 0 && (
                  <Box sx={{
                    my: 2,
                    p: 2,
                    bgcolor: difference >= 0 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 82, 82, 0.08)',
                    border: `1px solid ${difference >= 0 ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`,
                    borderRadius: 1
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em', display: 'block', mb: 1 }}>
                      DELTA ADJUSTMENT
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: difference >= 0 ? '#00e676' : '#ff5252', textShadow: difference >= 0 ? '0 0 10px rgba(0, 230, 118, 0.3)' : '0 0 10px rgba(255, 82, 82, 0.3)' }}>
                      {difference >= 0 ? '+' : ''}{difference.toLocaleString()} bbl
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.5 }}>
                      {difference >= 0 ? 'SURPLUS DETECTED' : 'DEFICIT DETECTED'}
                    </Typography>
                  </Box>
                )}

                <TextField
                  fullWidth
                  margin="normal"
                  label="Notes (optional)"
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Monthly physical inventory count"
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(255, 171, 0, 0.1)',
                    color: '#ffab00',
                    border: '1px solid #ffab00',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
                    '&:disabled': { opacity: 0.3 }
                  }}
                  disabled={!selectedTankId || physicalLevel < 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? 'PROCESSING...' : 'RECORD CALIBRATION'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {/* Adjustment Log Header */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader title="CALIBRATION LOG" color="warning" />
          </Box>

          <TableContainer component={Paper} sx={{ bgcolor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(16px)', boxShadow: '0 22px 50px rgba(5, 10, 18, 0.55)' }}>
            <Table size="small" sx={{ '& .MuiTableRow-root': { transition: 'background 0.25s ease' }, '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: 'rgba(0, 229, 255, 0.02)' }, '& .MuiTableRow-root:hover': { bgcolor: 'rgba(0, 229, 255, 0.05)' }, '@media (prefers-reduced-motion: reduce)': { '& .MuiTableRow-root': { transition: 'none' } } }}>
              <TableHead>
                <TableRow sx={styles.tableHeadRow}>
                  <TableCell>Date</TableCell>
                  <TableCell>Tank</TableCell>
                  <TableCell align="right">Delta</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem' }}>
                      No calibrations recorded yet. Submit a physical reading to start the log.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements?.slice(0, 20).map((movement) => {
                    const tank = movement.tank_id ? tankMap.get(movement.tank_id) : undefined;
                    const isPositive = (movement.actual_volume ?? 0) >= 0;
                    return (
                        <TableRow key={movement.id} sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(0, 229, 255, 0.1)', fontSize: '0.75rem', color: 'text.secondary' } }}>
                          <TableCell>
                            {formatDate(movement.created_at)}
                          </TableCell>
                          <TableCell>{tank?.name || 'Unknown'}</TableCell>

                        <TableCell align="right">
                          <Chip
                            label={`${isPositive ? '+' : ''}${(movement.actual_volume ?? 0).toLocaleString()} bbl`}
                            size="small"
                            sx={{
                              bgcolor: isPositive ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                              color: isPositive ? '#00e676' : '#ff5252',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}>
                          {movement.notes || '—'}
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
    </Box>
  );
}
