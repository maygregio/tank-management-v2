'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function TankCardSkeleton() {
  return (
    <Card
      sx={{
        height: '100%',
        borderTop: '1.5px solid rgba(0, 229, 255, 0.3)',
        background: 'linear-gradient(160deg, rgba(18, 26, 39, 0.92) 0%, rgba(10, 15, 26, 0.88) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.18)',
      }}
    >
      <CardContent sx={{ p: 2, pt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={6} height={6} sx={{ bgcolor: 'rgba(0, 229, 255, 0.3)' }} />
            <Skeleton variant="text" width={40} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
          <Skeleton variant="text" width={50} height={12} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        </Box>

        <Skeleton variant="text" width={120} height={20} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Skeleton variant="rectangular" height={6} sx={{ mb: 2.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Box>
            <Skeleton variant="text" width={60} height={12} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: 'rgba(0, 229, 255, 0.15)' }} />
          </Box>
          <Box>
            <Skeleton variant="text" width={60} height={12} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
