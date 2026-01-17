import type { MovementType, FuelType } from './types';

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

// Fuel type display labels
export const fuelTypeLabels: Record<FuelType, string> = {
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
  // Card gradient background
  cardGradient: 'linear-gradient(160deg, rgba(18, 26, 39, 0.92) 0%, rgba(10, 15, 26, 0.88) 100%)',

  // Section header separator gradient
  headerSeparator: 'linear-gradient(90deg, rgba(0, 229, 255, 0.35) 0%, transparent 100%)',
  headerSeparatorCyan: 'linear-gradient(90deg, var(--color-accent-cyan) 0%, transparent 100%)',

  // Table header row styling
  tableHeadRow: {
    '& .MuiTableCell-head': {
      color: 'text.secondary',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid var(--color-border)',
      backgroundImage: 'linear-gradient(90deg, rgba(0, 229, 255, 0.06), rgba(139, 92, 246, 0.08))',
    },
  },

  // Monospace font family
  monoFont: '"Plus Jakarta Sans", sans-serif',
};
