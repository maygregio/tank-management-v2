import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function COALoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="text" width={180} height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
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
            <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 1 }} />
          </Box>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Upload section skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              borderLeft: '2px solid var(--color-accent-cyan)',
            }}
          >
            <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 2 }} />
          </Box>
        </Grid>

        {/* Table section skeleton */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="text" width={80} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
                ))}
              </Box>
            </Box>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ p: 2, borderBottom: '1px solid rgba(0, 229, 255, 0.08)' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} variant="text" width={80} height={20} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
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
