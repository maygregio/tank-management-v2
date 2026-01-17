'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface MovementRow {
  id: string;
  dateLabel: string;
  type: 'load' | 'discharge' | 'transfer' | 'adjustment';
  status: boolean;
  movementVolume: number;
  tankAfter: number;
  notes: string | null;
}
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import MovementTypeChip from '@/components/MovementTypeChip';
import MovementStatus from '@/components/MovementStatus';
import SectionHeader from '@/components/SectionHeader';
import { tanksApi } from '@/lib/api';
import { fuelTypeLabels } from '@/lib/constants';

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
        <Typography sx={{ color: 'text.secondary', mb: 2 }}>UNIT NOT FOUND</Typography>
        <Button onClick={() => router.push('/tanks')} sx={{ color: 'var(--color-accent-cyan)' }}>
          Return to Registry
        </Button>
      </Box>
    );
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
    if (typeof value === 'string') {
      return value.split('T')[0];
    }
    return '—';
  };

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

  const sortedHistory = history ? [...history].sort(
    (a, b) => {
      const left = a.scheduled_date || a.created_at;
      const right = b.scheduled_date || b.created_at;
      return new Date(left).getTime() - new Date(right).getTime();
    }
  ) : [];

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

  const startingLevel = tank.initial_level || 0;
  const rows = runningBalanceRows.reduce<MovementRow[]>((acc, row) => {
    const previousTotal = acc.length ? acc[acc.length - 1].tankAfter : startingLevel;
    const tankAfter = Math.max(previousTotal + row.movementVolume, 0);
    acc.push({ ...row, tankAfter });
    return acc;
  }, []);

  return (
      <Box>
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
          <IconButton onClick={() => router.push('/tanks')} sx={{ color: 'text.secondary', '&:hover': { color: 'var(--color-accent-cyan)' } }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.25em' }}>
              UNIT TELEMETRY
            </Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700 }}>
              {tank.name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
              {tank.location} • {fuelTypeLabels[tank.fuel_type]} • {tank.capacity.toLocaleString()} bbl
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.12em' }}>
              ID: {tank.id.toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`${tank.level_percentage.toFixed(1)}% FULL`}
              size="small"
              sx={{
                bgcolor: 'rgba(0, 229, 255, 0.12)',
                color: 'var(--color-accent-cyan)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                border: '1px solid rgba(0, 229, 255, 0.25)',
              }}
            />
            <Button
              variant="outlined"
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={handleDelete}
              sx={{ color: '#ff5252', borderColor: '#ff5252', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)', borderColor: '#ff5252' } }}
            >
              Decommission
            </Button>
          </Box>
        </Box>


        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))',
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
              CAPACITY
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{tank.capacity.toLocaleString()} bbl</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
              CURRENT
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{tank.current_level.toLocaleString()} bbl</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
              FUEL TYPE
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{fuelTypeLabels[tank.fuel_type]}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.12em', fontSize: '0.6rem' }}>
              LAST ACTIVITY
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {history && history.length > 0
                ? new Date(history[0].scheduled_date).toLocaleDateString()
                : '—'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 5, mb: 2 }}>
          <SectionHeader title="ACTIVITY TIMELINE" />
        </Box>

        <Box sx={{ height: 460, width: '100%' }}>
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
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-cellContent': {
                display: 'flex',
                alignItems: 'center',
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
      </Box>

  );
}
