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

  // Dialog paper styling (glass effect)
  dialogPaper: {
    bgcolor: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(18, 26, 39, 0.95)',
    boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
    backdropFilter: 'blur(18px)',
  },

  // Summary stat card styling
  summaryCard: {
    p: 2,
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(10, 15, 26, 0.9)',
  },

  // Alert styling
  alertError: {
    bgcolor: 'rgba(255, 82, 82, 0.1)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
  },
  alertSuccess: {
    bgcolor: 'rgba(0, 230, 118, 0.1)',
    border: '1px solid rgba(0, 230, 118, 0.3)',
  },
};

// DataGrid shared styling
export const dataGridSx = {
  border: '1px solid var(--glass-border)',
  backgroundColor: 'rgba(10, 15, 26, 0.9)',
  borderRadius: '12px',
  '& .MuiDataGrid-columnHeaders': {
    borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    color: 'text.secondary',
  },
  '& .MuiDataGrid-cellContent': {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    color: 'inherit',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid rgba(0, 229, 255, 0.15)',
  },
};

// DataGrid with row hover and alternating rows
export const dataGridWithRowStylesSx = {
  ...dataGridSx,
  '& .MuiDataGrid-row': {
    '&:nth-of-type(even)': {
      backgroundColor: 'rgba(0, 229, 255, 0.02)',
    },
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
};
