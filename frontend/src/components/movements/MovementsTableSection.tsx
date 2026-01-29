import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { GridColDef, GridRowSelectionModel, GridPaginationModel } from '@mui/x-data-grid';
import SectionHeader from '@/components/SectionHeader';
import StyledDataGrid from '@/components/StyledDataGrid';
import type { MovementType, MovementUpdate } from '@/lib/types';
import type { MovementGridRowExtended } from './useMovementsViewModel';

interface MovementsTableSectionProps {
  rows: MovementGridRowExtended[];
  columns: GridColDef[];
  selectedRows: GridRowSelectionModel;
  onSelectedRowsChange: (selection: GridRowSelectionModel) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusFilterChange: (value: 'all' | 'pending' | 'completed') => void;
  typeFilter: MovementType | 'all';
  onTypeFilterChange: (value: MovementType | 'all') => void;
  editData: MovementUpdate;
  onEditDataChange: (data: MovementUpdate) => void;
  onBulkComplete: () => void;
  onBulkReschedule: () => void;
  // Server-side pagination props
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  rowCount: number;
  loading?: boolean;
}

export default function MovementsTableSection({
  rows,
  columns,
  selectedRows,
  onSelectedRowsChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  editData,
  onEditDataChange,
  onBulkComplete,
  onBulkReschedule,
  paginationModel,
  onPaginationModelChange,
  rowCount,
  loading,
}: MovementsTableSectionProps) {
  return (
    <Grid size={{ xs: 12, md: 7 }}>
      <Box sx={{ mb: 2 }}>
        <SectionHeader title="Operation Log" />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          mb: 2,
          p: 1.5,
          borderRadius: '8px',
          bgcolor: 'rgba(0, 229, 255, 0.03)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <TextField
          size="small"
          placeholder="Search tanks, notes…"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          inputProps={{ 'aria-label': 'Search movements' }}
          sx={{ minWidth: 140, flex: '1 1 140px' }}
        />
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'pending' | 'completed')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => onTypeFilterChange(e.target.value as MovementType | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="load">Load</MenuItem>
            <MenuItem value="discharge">Discharge</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
            <MenuItem value="adjustment">Adjustment</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            Selected: {selectedRows.ids.size}
          </Typography>
          <TextField
            size="small"
            type="date"
            value={editData.scheduled_date_manual || ''}
            onChange={(e) => onEditDataChange({ ...editData, scheduled_date_manual: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            inputProps={{ 'aria-label': 'Reschedule date' }}
            sx={{ width: 140 }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={selectedRows.ids.size === 0 || !editData.scheduled_date_manual}
            onClick={onBulkReschedule}
            sx={{ borderColor: 'var(--color-accent-cyan)', color: 'var(--color-accent-cyan)', whiteSpace: 'nowrap' }}
          >
            Reschedule
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={selectedRows.ids.size === 0}
            onClick={onBulkComplete}
            sx={{ borderColor: '#00e676', color: '#00e676', whiteSpace: 'nowrap' }}
          >
            Complete
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 520, width: '100%' }}>
        <StyledDataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          onRowSelectionModelChange={onSelectedRowsChange}
          rowSelectionModel={selectedRows}
          // Server-side pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          rowCount={rowCount}
          pageSizeOptions={[25, 50, 100]}
          loading={loading}
          getRowClassName={(params) => {
            const statusClass = params.row.status ? 'row-pending' : 'row-complete';
            const futureClass = params.row.isFuture ? 'row-future' : '';
            return `${statusClass} ${futureClass}`.trim();
          }}
          variant="movement"
        />
      </Box>
    </Grid>
  );
}
