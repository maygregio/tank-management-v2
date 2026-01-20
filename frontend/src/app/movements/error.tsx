'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function MovementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Movements page error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        p: 4,
        borderRadius: '14px',
        border: '1px solid rgba(255, 82, 82, 0.3)',
        backgroundColor: 'rgba(255, 82, 82, 0.05)',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ff5252', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#ff5252', fontWeight: 700, mb: 1 }}>
        Failed to Load Operations
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400, mb: 3 }}>
        {error.message || 'An unexpected error occurred while loading the operations log. Please try again.'}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={reset}
        sx={{
          borderColor: '#ff5252',
          color: '#ff5252',
          '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)', borderColor: '#ff5252' },
        }}
      >
        Try Again
      </Button>
    </Box>
  );
}
