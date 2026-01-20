import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function TanksLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="text" width={150} height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
        <Skeleton variant="rectangular" width={60} height={1} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
      </Box>

      {/* Filter bar skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1, bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1, bgcolor: 'rgba(0, 229, 255, 0.05)', ml: 'auto' }} />
      </Box>

      {/* Card grid skeleton */}
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
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
  );
}
