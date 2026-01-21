import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function AdjustmentsLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="text" width={200} height={24} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)' }} />
        <Skeleton variant="rectangular" width={60} height={1} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)' }} />
      </Box>
      <Skeleton variant="text" width={300} height={16} sx={{ bgcolor: 'rgba(255, 171, 0, 0.05)', mb: 4 }} />

      <Grid container spacing={3}>
        {/* Main content skeleton */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Stepper skeleton */}
          <Box sx={{ display: 'flex', gap: 4, mb: 4, justifyContent: 'center' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)' }} />
                <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: 'rgba(255, 171, 0, 0.05)' }} />
              </Box>
            ))}
          </Box>

          {/* Upload area skeleton */}
          <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Box
              sx={{
                border: '2px dashed var(--color-border)',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                bgcolor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)', mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: 'rgba(255, 171, 0, 0.05)', mx: 'auto' }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255, 171, 0, 0.03)', mx: 'auto', mt: 1 }} />
            </Box>
          </Box>
        </Grid>

        {/* Calibration log skeleton */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={140} height={20} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)' }} />
          </Box>
          <Box
            sx={{
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(10, 15, 26, 0.9)',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 229, 255, 0.15)', bgcolor: 'rgba(0, 229, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255, 171, 0, 0.1)' }} />
                ))}
              </Box>
            </Box>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ p: 2, borderBottom: '1px solid rgba(0, 229, 255, 0.08)' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} variant="text" width={60} height={18} sx={{ bgcolor: 'rgba(255, 171, 0, 0.05)' }} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
