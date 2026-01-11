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
      }}
    />
  );
}
