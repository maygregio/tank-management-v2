'use client';

import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface TankLevelGaugeProps {
  percentage: number;
  showLabel?: boolean;
}

function TankLevelGauge({
  percentage,
  showLabel = true,
}: TankLevelGaugeProps) {
  const statusColor = '#00e5ff';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        position: 'relative',
        flexGrow: 1,
        height: 6,
        bgcolor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1px',
        overflow: 'hidden'
      }}>
        {/* Tactical Tick Marks */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'space-between',
          px: '10%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((t) => (
            <Box key={t} sx={{ width: '1px', height: '100%', bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
          ))}
        </Box>

        {/* Animated Fill Bar */}
        <Box
          sx={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            bgcolor: statusColor,
            boxShadow: `0 0 12px ${statusColor}55`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
          }}
        />
      </Box>
      {showLabel && (
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: statusColor,
            minWidth: 42,
            textAlign: 'right',
            letterSpacing: '0.05em',
            textShadow: `0 0 8px ${statusColor}44`,
          }}
        >
          {percentage.toFixed(1)}%
        </Typography>
      )}
    </Box>
  );
}

export default memo(TankLevelGauge);
