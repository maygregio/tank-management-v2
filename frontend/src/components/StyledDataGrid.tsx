'use client';

import { DataGrid, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';
import { dataGridSx, dataGridWithRowStylesSx } from '@/lib/constants';

type StyledDataGridVariant = 'default' | 'striped' | 'movement' | 'overview';

type StyledDataGridProps<R extends GridValidRowModel> = DataGridProps<R> & {
  variant?: StyledDataGridVariant;
};

const movementSx = {
  ...dataGridWithRowStylesSx,
  '& .row-pending': {
    backgroundColor: alpha('#ffb300', 0.06),
  },
  '& .row-complete': {
    backgroundColor: alpha('#00e676', 0.05),
  },
  '& .row-future': {
    boxShadow: 'inset 3px 0 0 rgba(139, 92, 246, 0.6)',
  },
};

const overviewSx = {
  ...dataGridSx,
  '& .MuiDataGrid-columnHeaderTitle': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    color: 'text.secondary',
    fontSize: '0.85rem',
  },
  '& .MuiDataGrid-cell--editable:hover': {
    bgcolor: 'rgba(0, 229, 255, 0.08)',
    cursor: 'pointer',
  },
  '& .MuiDataGrid-cell--editing': {
    bgcolor: 'rgba(0, 229, 255, 0.12) !important',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid var(--glass-border)',
    bgcolor: 'rgba(0, 229, 255, 0.04)',
  },
};

const variantStyles: Record<StyledDataGridVariant, typeof dataGridSx> = {
  default: dataGridSx,
  striped: dataGridWithRowStylesSx,
  movement: movementSx,
  overview: overviewSx,
};

export default function StyledDataGrid<R extends GridValidRowModel>({
  variant = 'default',
  sx,
  disableRowSelectionOnClick,
  ...props
}: StyledDataGridProps<R>) {
  return (
    <DataGrid
      {...props}
      disableRowSelectionOnClick={disableRowSelectionOnClick ?? true}
      sx={sx ? [variantStyles[variant], sx].flat() : variantStyles[variant]}
    />
  );
}
