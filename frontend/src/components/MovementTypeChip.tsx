'use client';

import Chip from '@mui/material/Chip';
import { movementTypeLabels, movementTypeColors, movementTypeChipColors } from '@/lib/constants';
import type { MovementType } from '@/lib/types';

interface MovementTypeChipProps {
  type: MovementType;
}

export default function MovementTypeChip({ type }: MovementTypeChipProps) {
  const colorKey = movementTypeColors[type];
  const colors = movementTypeChipColors[colorKey];

  return (
    <Chip
      label={movementTypeLabels[type].toUpperCase()}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontSize: '0.6rem',
        fontWeight: 700,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 6px 16px rgba(5, 10, 18, 0.35)',
      }}
    />
  );
}
