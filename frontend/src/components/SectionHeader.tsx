'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styles } from '@/lib/constants';

interface SectionHeaderProps {
  title: string;
  color?: 'cyan' | 'warning';
}

export default function SectionHeader({ title, color = 'cyan' }: SectionHeaderProps) {
  const accentColor = color === 'cyan' ? 'var(--color-accent-cyan)' : '#ffb300';
  const lineColor = color === 'cyan'
    ? 'rgba(0, 229, 255, 0.35)'
    : 'rgba(255, 179, 0, 0.35)';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: accentColor,
          fontWeight: 700,
          letterSpacing: '0.2em',
          fontSize: '0.65rem',
          position: 'relative',
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: '1px',
          backgroundColor: lineColor,
        }}
      />
    </Box>
  );
}
