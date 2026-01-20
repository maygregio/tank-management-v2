import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

export default function TankDetailLoading() {
  return (
    <Box>
      {/* Header bar skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          p: 2,
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(12, 18, 29, 0.92)',
        }}
      >
        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={100} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
          <Skeleton variant="text" width={200} height={28} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 0.5 }} />
          <Skeleton variant="text" width={250} height={14} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', mt: 0.5 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '16px', bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: '16px', bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1, bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
          <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1, bgcolor: 'rgba(255, 82, 82, 0.1)' }} />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          {/* Capacity section skeleton */}
          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              mb: 3,
            }}
          >
            <Skeleton variant="text" width={150} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
            <Skeleton variant="rectangular" height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', borderRadius: 1, mb: 3 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ borderLeft: '2px solid var(--color-accent-cyan)', pl: 2 }}>
                <Skeleton variant="text" width="60%" height={12} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
                <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 0.5 }} />
              </Box>
              <Box sx={{ borderLeft: '2px solid rgba(139, 92, 246, 0.6)', pl: 2 }}>
                <Skeleton variant="text" width="60%" height={12} sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)' }} />
                <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: 'rgba(139, 92, 246, 0.15)', mt: 0.5 }} />
              </Box>
            </Box>
          </Box>

          {/* Chart section skeleton */}
          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              mb: 3,
            }}
          >
            <Skeleton variant="text" width={120} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)', borderRadius: 1 }} />
          </Box>

          {/* Info grid skeleton */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i}>
                <Skeleton variant="text" width="50%" height={12} sx={{ bgcolor: 'rgba(0, 229, 255, 0.05)' }} />
                <Skeleton variant="text" width="70%" height={18} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', mt: 0.5 }} />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Activity timeline skeleton */}
      <Box sx={{ mt: 5, mb: 2 }}>
        <Skeleton variant="text" width={150} height={24} sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }} />
      </Box>
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(10, 15, 26, 0.9)',
          overflow: 'hidden',
        }}
      >
        <Skeleton variant="rectangular" height={52} sx={{ bgcolor: 'rgba(0, 229, 255, 0.08)' }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={52} sx={{ bgcolor: i % 2 ? 'rgba(0, 229, 255, 0.02)' : 'transparent' }} />
        ))}
      </Box>
    </Box>
  );
}
