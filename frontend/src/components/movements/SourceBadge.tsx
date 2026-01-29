import Chip from '@mui/material/Chip';
import type { MovementSource } from '@/lib/types';
import { movementSourceLabelMap } from '@/lib/movementSource';

interface SourceBadgeProps {
  source: MovementSource;
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  const styles = {
    manual: {
      bgcolor: 'rgba(0, 229, 255, 0.1)',
      color: 'var(--color-accent-cyan)',
    },
    pdf_import: {
      bgcolor: 'rgba(139, 92, 246, 0.15)',
      color: '#a78bfa',
    },
    signal: {
      bgcolor: 'rgba(0, 230, 118, 0.15)',
      color: '#00e676',
    },
    adjustment: {
      bgcolor: 'rgba(255, 179, 0, 0.15)',
      color: '#ffb300',
    },
  } satisfies Record<MovementSource, { bgcolor: string; color: string }>;

  return (
    <Chip
      label={movementSourceLabelMap[source]}
      size="small"
      sx={{
        ...styles[source],
        fontSize: '0.6rem',
        fontWeight: 700,
        height: 20,
      }}
    />
  );
}
