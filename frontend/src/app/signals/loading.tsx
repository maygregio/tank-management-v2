import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function SignalsLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="text" width={160} height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
        <Skeleton variant="rectangular" width={60} height={1} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
      </Box>

      {/* Summary cards skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(10, 15, 26, 0.9)',
            }}
          >
            <Skeleton variant="text" width="60%" height={12} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 1 }} />
          </Box>
        ))}
      </Box>

      {/* Main content skeleton */}
      <Grid container spacing={3}>
        {/* Upload section skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(14, 21, 33, 0.92)',
              borderLeft: '2px solid var(--color-accent-cyan)',
            }}
          >
            <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
            <Box
              sx={{
                border: '2px dashed var(--color-border)',
                borderRadius: '12px',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
              <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
              <Skeleton variant="text" width="50%" height={12} sx={{ bgcolor: 'rgba(0, 229, 255, 0.03)', mt: 1 }} />
            </Box>
          </Box>
        </Grid>

        {/* Table skeleton */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="text" width="30%" height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
          <Box
            sx={{
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(10, 15, 26, 0.9)',
              overflow: 'hidden',
            }}
          >
            <Skeleton variant="rectangular" height={52} sx={{ bgcolor: 'rgba(0, 229, 255, 0.08)' }} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ bgcolor: i % 2 ? 'rgba(0, 229, 255, 0.02)' : 'transparent' }} />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
