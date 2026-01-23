'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { OverviewGrid } from '@/components/overview';

export default function OverviewPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            color: 'var(--color-accent-cyan)',
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
          }}
        >
          Movement Overview
        </Typography>
        <Box
          sx={{
            width: 60,
            height: '1px',
            backgroundColor: 'rgba(0, 229, 255, 0.35)',
          }}
        />
      </Box>

      <OverviewGrid />
    </Box>
  );
}
