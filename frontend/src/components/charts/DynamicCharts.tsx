'use client';

import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ChartLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: 200,
    }}
  >
    <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
  </Box>
);

// Dynamic import for BaseChart - loads Highcharts bundle on demand
export const DynamicBaseChart = dynamic(
  () => import('./BaseChart'),
  {
    loading: ChartLoadingFallback,
    ssr: false, // Highcharts requires browser APIs
  }
);

// Dynamic import for TankActivityChart
export const DynamicTankActivityChart = dynamic(
  () => import('./TankActivityChart'),
  {
    loading: ChartLoadingFallback,
    ssr: false,
  }
);

// Dynamic import for AreaChart
export const DynamicAreaChart = dynamic(
  () => import('./AreaChart'),
  {
    loading: ChartLoadingFallback,
    ssr: false,
  }
);
