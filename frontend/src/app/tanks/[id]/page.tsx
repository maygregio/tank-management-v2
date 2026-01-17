'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import TankLevelGauge from '@/components/TankLevelGauge';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import { tanksApi } from '@/lib/api';
import { fuelTypeLabels, styles } from '@/lib/constants';

export default function TankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tankId = params.id as string;

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
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.push('/tanks');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this tank? All movement history will be preserved.')) {
      deleteMutation.mutate(tankId);
    }
  };

  const isLoading = tankLoading || historyLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  if (!tank) {
    return (
      <Box sx={{ textAlign: 'center', p: 6, border: '1px solid var(--color-border)', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Typography sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2 }}>UNIT NOT FOUND</Typography>
        <Button onClick={() => router.push('/tanks')} sx={{ color: 'var(--color-accent-cyan)' }}>
          Return to Registry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Tactical Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/tanks')} sx={{ color: 'text.secondary', '&:hover': { color: 'var(--color-accent-cyan)' } }}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            UNIT TELEMETRY: {tank.name.toUpperCase()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.6rem' }}>
            ID: {tank.id.toUpperCase()}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
          onClick={handleDelete}
          sx={{ color: '#ff5252', borderColor: '#ff5252', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)', borderColor: '#ff5252' } }}
        >
          Decommission
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Unit Specifications Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{
            background: styles.cardGradient,
            borderLeft: '2px solid var(--color-accent-cyan)',
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem' }}>
                UNIT SPECIFICATIONS
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'var(--color-border)' }} />

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>LOCATION</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{tank.location}</Typography>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>FUEL CLASS</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={fuelTypeLabels[tank.fuel_type]} size="small" sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: 'var(--color-accent-cyan)', fontSize: '0.7rem' }} />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.1em' }}>MAX CAPACITY</Typography>
                <Typography sx={{ fontFamily: 'monospace', color: 'var(--color-accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{tank.capacity.toLocaleString()} bbl</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Status Panel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{
            mb: 3,
            background: styles.cardGradient,
            borderTop: '2px solid var(--color-accent-cyan)',
          }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
                LIVE STATUS
              </Typography>
              <Box sx={{ my: 3 }}>
                <TankLevelGauge percentage={tank.level_percentage} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-cyan)', textShadow: '0 0 20px rgba(0, 212, 255, 0.2)' }}>
                  {tank.current_level.toLocaleString()}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>bbl</Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem', mt: 1 }}>
                {tank.level_percentage.toFixed(1)}% OF {tank.capacity.toLocaleString()} bbl TOTAL CAPACITY
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Movement Log Header */}
      <Box sx={{ mt: 5, mb: 2 }}>
        <SectionHeader title="MOVEMENT LOG" />
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', border: '1px solid var(--color-border)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={styles.tableHeadRow}>
              <TableCell>Date</TableCell>
              <TableCell>Operation</TableCell>
              <TableCell align="right">Expected</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  NO MOVEMENT RECORDS FOUND
                </TableCell>
              </TableRow>
            ) : (
              history?.map((movement) => {
                const isOutgoing = movement.type === 'discharge' || (movement.type === 'transfer' && movement.tank_id === tankId);
                const sign = isOutgoing ? '-' : '+';
                const isPending = movement.actual_volume === null;
                return (
                  <TableRow key={movement.id} sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {new Date(movement.scheduled_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <MovementTypeChip type={movement.type} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {sign}{movement.expected_volume.toLocaleString()} bbl
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', color: isPending ? 'text.disabled' : 'text.primary' }}>
                      {movement.actual_volume !== null
                        ? `${sign}${Math.abs(movement.actual_volume).toLocaleString()} bbl`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <MovementStatus isPending={isPending} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {movement.notes || '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
