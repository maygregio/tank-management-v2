'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

export default function StatCardSkeleton() {
  return (
    <Card sx={{
      background: 'linear-gradient(135deg, rgba(17, 25, 33, 0.9) 0%, rgba(10, 14, 20, 1) 100%)',
      border: '1px solid rgba(0, 229, 255, 0.2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Skeleton variant="text" width={60} height={14} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Skeleton variant="text" width={80} height={28} sx={{ bgcolor: 'rgba(0, 229, 255, 0.15)' }} />
      </CardContent>
    </Card>
  );
}
