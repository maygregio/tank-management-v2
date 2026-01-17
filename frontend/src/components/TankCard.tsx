'use client';

import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TankLevelGauge from './TankLevelGauge';
import { fuelTypeLabels, styles } from '@/lib/constants';
import type { TankWithLevel } from '@/lib/types';

interface TankCardProps {
  tank: TankWithLevel;
}

export default function TankCard({ tank }: TankCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        borderTop: '1.5px solid var(--color-accent-cyan)',
        background: styles.cardGradient,
        boxShadow: '0 18px 45px rgba(5, 10, 18, 0.55)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(140deg, rgba(0, 229, 255, 0.08), rgba(139, 92, 246, 0.06))',
          opacity: 0,
          transition: 'opacity 0.35s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          borderColor: 'var(--color-accent-cyan)',
          transform: 'translateY(-4px)',
          boxShadow: '0 24px 65px rgba(0, 229, 255, 0.12)',
          '&::after': {
            opacity: 1,
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
      }}
    >
      <CardActionArea component={Link} href={`/tanks/${tank.id}`} sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
        <CardContent sx={{ p: 2, pt: 1.5 }}>
          {/* Tactical Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#00e676',
                  boxShadow: '0 0 8px #00e676',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  fontSize: '0.65rem'
                }}
              >
                {fuelTypeLabels[tank.fuel_type]}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              ID: {tank.id.slice(-6).toUpperCase()}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 600,
              mb: 2,
              letterSpacing: '0.01em',
              color: 'text.primary',
              fontSize: '0.875rem'
            }}
          >
            {tank.name.toUpperCase()}
          </Typography>

          <Box sx={{ mb: 2.5 }}>
            <TankLevelGauge percentage={tank.level_percentage} />
          </Box>

          {/* Instrument Panel Readouts */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.05)', pl: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.6rem', mb: 0.25, letterSpacing: '0.02em' }}>
                CURRENT_LVL
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-accent-cyan)', fontSize: '0.8rem' }}>
                {tank.current_level.toLocaleString()}<Box component="span" sx={{ fontSize: '0.6rem', ml: 0.5, color: 'text.disabled' }}>bbl</Box>
              </Typography>
            </Box>
            <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.05)', pl: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.6rem', mb: 0.25, letterSpacing: '0.02em' }}>
                MAX_CAPACITY
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>
                {tank.capacity.toLocaleString()}<Box component="span" sx={{ fontSize: '0.6rem', ml: 0.5, color: 'text.disabled' }}>bbl</Box>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
