'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import type { Alert as AlertType } from '@/lib/types';

interface AlertBannerProps {
  alerts: AlertType[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 1.5,
        border: '1px solid rgba(255, 179, 0, 0.35)',
        background: 'linear-gradient(180deg, rgba(255, 179, 0, 0.12) 0%, rgba(10, 14, 23, 0.6) 100%)',
        position: 'relative',
        borderRadius: '6px',
        animation: 'pulse 3s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': { boxShadow: 'inset 0 0 10px rgba(255, 179, 0, 0.12), 0 0 12px rgba(255, 179, 0, 0.2)' },
          '50%': { boxShadow: 'inset 0 0 20px rgba(255, 179, 0, 0.2), 0 0 18px rgba(255, 179, 0, 0.32)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 179, 0, 0.05) 1px, rgba(255, 179, 0, 0.05) 2px)',
          pointerEvents: 'none',
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            bgcolor: 'var(--color-warning)',
            borderRadius: '1px',
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': { '50%': { opacity: 0 } },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
        />
        <Typography
          variant="overline"
          sx={{
            color: 'var(--color-warning)',
            fontWeight: 800,
            letterSpacing: '0.15em',
            lineHeight: 1
          }}
        >
          CRITICAL SYSTEM ALERT // RESERVES DEPLETED ({alerts.length})
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
        {alerts.map((alert) => (
          <Box key={alert.tank_id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, px: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 171, 0, 0.9)', fontWeight: 600, fontSize: '0.65rem' }}>
                {alert.tank_name.toUpperCase()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.65rem' }}>
                {alert.level_percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={alert.level_percentage}
              sx={{
                height: 4,
                bgcolor: 'rgba(255, 171, 0, 0.1)',
                borderRadius: '1px',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'var(--color-warning)',
                  boxShadow: '0 0 8px var(--color-warning)'
                }
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
