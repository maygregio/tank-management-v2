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
  diesel: 'Diesel',
  gasoline: 'Gasoline',
  other: 'Other',
};

// Color mappings for movement type chips
export const movementTypeChipColors: Record<'success' | 'error' | 'info' | 'warning', { bg: string; text: string }> = {
  success: { bg: 'rgba(0, 230, 118, 0.1)', text: '#00e676' },
  error: { bg: 'rgba(255, 82, 82, 0.1)', text: '#ff5252' },
  info: { bg: 'rgba(0, 212, 255, 0.1)', text: '#00d4ff' },
  warning: { bg: 'rgba(255, 171, 0, 0.1)', text: '#ffab00' },
};

// Common styling constants
export const styles = {
  // Card gradient background
  cardGradient: 'linear-gradient(180deg, rgba(17, 25, 33, 1) 0%, rgba(10, 14, 20, 1) 100%)',

  // Section header separator gradient
  headerSeparator: 'linear-gradient(90deg, rgba(0, 212, 255, 0.3) 0%, transparent 100%)',
  headerSeparatorCyan: 'linear-gradient(90deg, var(--color-accent-cyan) 0%, transparent 100%)',

  // Table header row styling
  tableHeadRow: {
    '& .MuiTableCell-head': {
      color: 'text.secondary',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid var(--color-border)',
    },
  },

  // Monospace font family
  monoFont: '"JetBrains Mono", "Roboto Mono", monospace',
};
