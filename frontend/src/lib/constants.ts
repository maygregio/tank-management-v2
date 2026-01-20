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

// ============================================================================
// Centralized Button Styles
// ============================================================================

export const buttonStyles = {
  // Primary action button (cyan)
  primary: {
    bgcolor: 'rgba(0, 212, 255, 0.1)',
    color: 'var(--color-accent-cyan)',
    border: '1px solid var(--color-accent-cyan)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
    '&:disabled': { opacity: 0.3 },
  },
  // Success action button (green)
  success: {
    bgcolor: 'rgba(0, 230, 118, 0.1)',
    color: '#00e676',
    border: '1px solid #00e676',
    '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
    '&:disabled': { opacity: 0.3 },
  },
  // Warning action button (orange/amber)
  warning: {
    bgcolor: 'rgba(255, 171, 0, 0.1)',
    color: '#ffab00',
    border: '1px solid #ffab00',
    '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
    '&:disabled': { opacity: 0.3 },
  },
  // Danger action button (red)
  danger: {
    color: '#ff5252',
    borderColor: '#ff5252',
    '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)', borderColor: '#ff5252' },
  },
  // Secondary/muted button
  secondary: {
    color: 'text.secondary',
    borderColor: 'divider',
    '&:hover': { color: 'var(--color-accent-cyan)', borderColor: 'var(--color-accent-cyan)' },
  },
  // Purple accent button
  purple: {
    borderColor: '#8b5cf6',
    color: '#8b5cf6',
    '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
  },
} as const;

// ============================================================================
// Centralized Card Styles
// ============================================================================

export const cardStyles = {
  // Standard glass card
  glass: {
    borderRadius: '14px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(12, 18, 29, 0.88)',
  },
  // Card with left accent border
  accentedCyan: {
    background: styles.cardGradient,
    borderLeft: '2px solid var(--color-accent-cyan)',
    boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
  },
  // Header bar card (tank detail, etc.)
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    borderRadius: '14px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(12, 18, 29, 0.92)',
    boxShadow: '0 20px 50px rgba(5, 10, 18, 0.55)',
    backdropFilter: 'blur(18px)',
  },
} as const;

// ============================================================================
// Centralized Text Styles
// ============================================================================

export const textStyles = {
  // Page title overline
  pageTitle: {
    color: 'var(--color-accent-cyan)',
    fontWeight: 800,
    fontSize: '0.8rem',
    letterSpacing: '0.2em',
  },
  // Section overline
  sectionTitle: {
    color: 'var(--color-accent-cyan)',
    fontWeight: 700,
    letterSpacing: '0.15em',
    fontSize: '0.65rem',
    mb: 2,
    display: 'block',
  },
  // Label caption
  label: {
    color: 'text.secondary',
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
  },
  // Value display (cyan accent)
  valueCyan: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--color-accent-cyan)',
  },
} as const;

// ============================================================================
// Centralized Icon Button Styles
// ============================================================================

export const iconButtonStyles = {
  edit: {
    color: '#ffab00',
    '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.1)' },
  },
  complete: {
    color: 'var(--color-accent-cyan)',
    '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.1)' },
  },
  delete: {
    color: '#ff5252',
    '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)' },
  },
  back: {
    color: 'text.secondary',
    '&:hover': { color: 'var(--color-accent-cyan)' },
  },
} as const;
