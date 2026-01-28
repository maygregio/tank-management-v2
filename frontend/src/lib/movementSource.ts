import type { MovementSource } from './types';

export type MovementSourceFilter = MovementSource | 'all';

export const movementSourceLabelMap: Record<MovementSource, string> = {
  manual: 'Manual',
  pdf_import: 'PDF',
  signal: 'Signal',
  adjustment: 'Adjustment',
};

export const movementSourceOptions: Array<{ value: MovementSource; label: string }> = [
  { value: 'manual', label: movementSourceLabelMap.manual },
  { value: 'pdf_import', label: movementSourceLabelMap.pdf_import },
  { value: 'signal', label: movementSourceLabelMap.signal },
  { value: 'adjustment', label: movementSourceLabelMap.adjustment },
];

export function normalizeMovementSource(source?: MovementSource): MovementSource {
  return source ?? 'manual';
}
