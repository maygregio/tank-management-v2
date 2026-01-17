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
  const gradientColor = color === 'cyan'
    ? styles.headerSeparator
    : 'linear-gradient(90deg, rgba(255, 179, 0, 0.35) 0%, transparent 100%)';

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
          background: gradientColor,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -1,
            right: 0,
            width: 140,
            height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4))',
            opacity: color === 'cyan' ? 0.6 : 0.3,
          },
        }}
      />
    </Box>
  );
}
