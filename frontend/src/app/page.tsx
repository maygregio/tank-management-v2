'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { dashboardApi, tanksApi } from '@/lib/api';
import TankCard from '@/components/TankCard';
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
          fontFamily: '"JetBrains Mono", monospace',
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

  const isLoading = statsLoading || tanksLoading;

  const tanksByLocation = useMemo(() => (tanks?.reduce((acc, tank) => {
    const location = tank.location;
    if (!acc[location]) acc[location] = [];
    acc[location].push(tank);
    return acc;
  }, {} as Record<string, TankWithLevel[]>) || {}), [tanks]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
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

      {Object.keys(tanksByLocation).length === 0 ? (
        <Alert severity="info" sx={{ bgcolor: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
          System diagnostics: No tank units detected.
        </Alert>
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
              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', opacity: 0.5 }}>
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
