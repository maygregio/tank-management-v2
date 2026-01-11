'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface MovementStatusProps {
  isPending: boolean;
}

export default function MovementStatus({ isPending }: MovementStatusProps) {
  const color = isPending ? '#ffab00' : '#00e676';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
        {isPending ? 'Pending' : 'Complete'}
      </Typography>
    </Box>
  );
}
