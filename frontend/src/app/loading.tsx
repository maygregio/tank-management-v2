import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function DashboardLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="text" width={180} height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
        <Skeleton variant="rectangular" width={60} height={1} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
      </Box>

      {/* Stats cards skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.92)',
              borderLeft: '2px solid var(--color-accent-cyan)',
            }}
          >
            <Skeleton variant="text" width="60%" height={14} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
            <Skeleton variant="text" width="40%" height={48} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 1 }} />
          </Box>
        ))}
      </Box>

      {/* Location sections skeleton */}
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <Box key={sectionIndex} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="text" width={150} height={20} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
            <Skeleton variant="rectangular" width={40} height={1} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
            <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
          </Box>
          <Grid container spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '14px',
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'rgba(12, 18, 29, 0.88)',
                    height: 180,
                  }}
                >
                  <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
                  <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', mt: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', mt: 2, borderRadius: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="text" width="30%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
                    <Skeleton variant="text" width="30%" height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
