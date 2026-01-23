import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function OverviewLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton
          variant="text"
          width={180}
          height={24}
          sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }}
        />
        <Skeleton
          variant="rectangular"
          width={60}
          height={1}
          sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)' }}
        />
      </Box>

      {/* Toolbar skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton
          variant="text"
          width={120}
          height={32}
          sx={{ bgcolor: 'rgba(0, 229, 255, 0.08)' }}
        />
        <Skeleton
          variant="rectangular"
          width={140}
          height={40}
          sx={{ bgcolor: 'rgba(0, 229, 255, 0.08)', borderRadius: 1 }}
        />
      </Box>

      {/* DataGrid skeleton */}
      <Box
        sx={{
          height: 600,
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(10, 15, 26, 0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ bgcolor: 'rgba(0, 229, 255, 0.08)' }}
        />
        {/* Data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={52}
            sx={{
              bgcolor: i % 2 ? 'rgba(0, 229, 255, 0.02)' : 'transparent',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
