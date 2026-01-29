import type { MovementType, FeedstockType } from './types';

// ============================================================================
// Timing & Polling Constants
// ============================================================================

/** Default polling interval in milliseconds (30 seconds) */
export const DEFAULT_POLLING_INTERVAL_MS = 30000;

/** Debounce delay for search inputs in milliseconds */
export const DEBOUNCE_DELAY_MS = 500;

/** Animation duration for card hover effects in seconds */
export const CARD_HOVER_TRANSITION_SECONDS = 0.35;

/** Row transition duration for tables in seconds */
export const TABLE_ROW_TRANSITION_SECONDS = 0.25;

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
// PDF URL Utilities
// ============================================================================

/**
 * Extracts blob name from Azure Blob Storage URL and opens PDF in new tab.
 * Centralizes the PDF URL handling logic used across the application.
 *
 * @param pdfUrl - The Azure Blob Storage URL
 * @param getPdfUrlFn - Function to construct the API URL from blob name
 */
export function openPdfInNewTab(pdfUrl: string, getPdfUrlFn: (blobName: string) => string): void {
  const url = new URL(pdfUrl);
  const pathParts = url.pathname.split('/').slice(2);
  const blobName = pathParts.map((part) => decodeURIComponent(part)).join('/');
  window.open(getPdfUrlFn(blobName), '_blank');
}
