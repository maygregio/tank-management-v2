import Chip from '@mui/material/Chip';
import type { MovementSource } from './useMovementsViewModel';

interface SourceBadgeProps {
  source: MovementSource;
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  if (source === 'pdf') {
    return (
      <Chip
        label="PDF"
        size="small"
        sx={{
          bgcolor: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          fontSize: '0.6rem',
          fontWeight: 700,
          height: 20,
        }}
      />
    );
  }
  return (
    <Chip
      label="Manual"
      size="small"
      sx={{
        bgcolor: 'rgba(0, 229, 255, 0.1)',
        color: 'var(--color-accent-cyan)',
        fontSize: '0.6rem',
        fontWeight: 700,
        height: 20,
      }}
    />
  );
}
