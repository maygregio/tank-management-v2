import type { MovementType, FeedstockType } from './types';

// Movement type display labels
export const movementTypeLabels: Record<MovementType, string> = {
  load: 'Load',
  discharge: 'Discharge',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
};

// Movement type semantic colors
export const movementTypeColors: Record<MovementType, 'success' | 'error' | 'info' | 'warning'> = {
  load: 'success',
  discharge: 'error',
  transfer: 'info',
  adjustment: 'warning',
};

// Feedstock type display labels
export const feedstockTypeLabels: Record<FeedstockType, string> = {
  carbon_black_oil: 'Carbon Black Oil',
  other: 'Other',
};

// Color mappings for movement type chips
export const movementTypeChipColors: Record<'success' | 'error' | 'info' | 'warning', { bg: string; text: string }> = {
  success: { bg: 'rgba(0, 230, 118, 0.12)', text: '#00f0a8' },
  error: { bg: 'rgba(255, 82, 82, 0.12)', text: '#ff6b6b' },
  info: { bg: 'rgba(0, 229, 255, 0.12)', text: '#00e5ff' },
  warning: { bg: 'rgba(255, 179, 0, 0.12)', text: '#ffb300' },
};

// Common styling constants
export const styles = {
  // Card solid background
  cardGradient: 'rgba(14, 21, 33, 0.92)',

  // Section header separator color
  headerSeparator: 'rgba(0, 229, 255, 0.35)',
  headerSeparatorCyan: 'var(--color-accent-cyan)',

  // Table header row styling
  tableHeadRow: {
    '& .MuiTableCell-head': {
      color: 'text.secondary',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'rgba(0, 229, 255, 0.06)',
    },
  },

  // Monospace font family
  monoFont: '"Plus Jakarta Sans", sans-serif',
};
