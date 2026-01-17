'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { dashboardApi, tanksApi, movementsApi } from '@/lib/api';
import TankCard from '@/components/TankCard';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import StatCardSkeleton from '@/components/skeletons/StatCardSkeleton';
import EmptyState from '@/components/EmptyState';
import StorageIcon from '@mui/icons-material/Storage';
import type { TankWithLevel } from '@/lib/types';

function StatCard({ title, value }: { title: string; value: string | number }) {
  const accent = 'var(--color-accent-cyan)';
  return (
    <Card sx={{
      background: 'linear-gradient(135deg, rgba(17, 25, 33, 0.9) 0%, rgba(10, 14, 20, 1) 100%)',
      border: `1px solid ${accent}33`,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '2px',
        height: '100%',
        backgroundColor: accent,
        boxShadow: `0 0 8px ${accent}66`,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)',
        backgroundSize: '16px 16px',
        pointerEvents: 'none',
      }
    }}>
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Typography variant="overline" sx={{
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          opacity: 0.8
        }}>
          <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: accent, display: 'inline-block' }} />
          {title.toUpperCase()}
        </Typography>
        <Typography variant="h5" sx={{
          color: accent,
          fontWeight: 700,
          textShadow: `0 0 12px ${accent}44`,
          fontSize: '1.4rem'
        }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const { data: movements } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.getAll(),
  });

  const isLoading = statsLoading || tanksLoading;

  const tanksByLocation = useMemo(() => (tanks?.reduce((acc, tank) => {
    const location = tank.location;
    if (!acc[location]) acc[location] = [];
    acc[location].push(tank);
    return acc;
  }, {} as Record<string, TankWithLevel[]>) || {}), [tanks]);

  const fuelVolumeByType = useMemo(() => {
    if (!tanks) return [];
    const volumeByType: Record<string, number> = { diesel: 0, gasoline: 0, other: 0 };
    tanks.forEach(tank => {
      if (volumeByType[tank.fuel_type] !== undefined) {
        volumeByType[tank.fuel_type] += tank.current_level;
      }
    });
    return [
      { name: 'Diesel', y: volumeByType.diesel, color: '#00e676' },
      { name: 'Gasoline', y: volumeByType.gasoline, color: '#00e5ff' },
      { name: 'Other', y: volumeByType.other, color: '#8b5cf6' }
    ];
  }, [tanks]);

  const movementVolumeByType = useMemo(() => {
    if (!movements) return { load: 0, discharge: 0, transfer: 0, adjustment: 0 };
    const volumeByType = { load: 0, discharge: 0, transfer: 0, adjustment: 0 };
    movements.forEach(movement => {
      const volume = Math.abs(movement.actual_volume ?? movement.expected_volume);
      volumeByType[movement.type] += volume;
    });
    return volumeByType;
  }, [movements]);

  if (isLoading) {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 4 }} key={i}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box className="card-hover">
            <StatCard title="Locations" value={stats?.total_locations || 0} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box className="card-hover">
            <StatCard title="Active Systems" value={stats?.total_tanks || 0} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box className="card-hover">
            <StatCard
              title="Total Capacity"
              value={`${((stats?.total_fuel_volume || 0) / 1000).toFixed(1)}k bbl`}
            />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{
            p: 3,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))'
          }}>
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              FUEL VOLUME BY TYPE
            </Typography>
            <PieChart data={fuelVolumeByType} height={250} title="Current Fuel Volume" />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{
            p: 3,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'linear-gradient(140deg, rgba(14, 21, 34, 0.88), rgba(9, 14, 23, 0.85))'
          }}>
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              MOVEMENT ACTIVITY BY TYPE
            </Typography>
            <BarChart
              categories={['Load', 'Discharge', 'Transfer', 'Adjustment']}
              data={[
                movementVolumeByType.load,
                movementVolumeByType.discharge,
                movementVolumeByType.transfer,
                movementVolumeByType.adjustment
              ]}
              height={250}
              name="Volume (bbl)"
            />
          </Box>
        </Grid>
      </Grid>

      {Object.keys(tanksByLocation).length === 0 ? (
        <EmptyState
          icon={<StorageIcon />}
          title="No Storage Units Deployed"
          description="Head to the Tanks page to deploy your first unit and begin monitoring levels."
          action={{
            label: 'Go to Tanks',
            onClick: () => window.location.href = '/tanks'
          }}
        />
      ) : (
        Object.entries(tanksByLocation).map(([location, locationTanks]) => (
          <Box key={location} sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="overline" sx={{
                color: 'var(--color-accent-cyan)',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.2em'
              }}>
                LOCATION: {location.toUpperCase()}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.3) 0%, transparent 100%)' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.5 }}>
                {locationTanks.length} UNIT{locationTanks.length !== 1 ? 'S' : ''}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {locationTanks.map((tank) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={tank.id}>
                  <TankCard tank={tank} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
}
