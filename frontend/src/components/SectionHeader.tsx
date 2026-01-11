'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styles } from '@/lib/constants';

interface SectionHeaderProps {
  title: string;
  color?: 'cyan' | 'warning';
}

export default function SectionHeader({ title, color = 'cyan' }: SectionHeaderProps) {
  const accentColor = color === 'cyan' ? 'var(--color-accent-cyan)' : '#ffab00';
  const gradientColor = color === 'cyan'
    ? styles.headerSeparator
    : 'linear-gradient(90deg, rgba(255, 171, 0, 0.3) 0%, transparent 100%)';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography
        variant="overline"
        sx={{
          color: accentColor,
          fontWeight: 700,
          letterSpacing: '0.15em',
          fontSize: '0.65rem',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', background: gradientColor }} />
    </Box>
  );
}
