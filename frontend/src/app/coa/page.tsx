'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import ScienceIcon from '@mui/icons-material/Science';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { coaApi, movementsApi } from '@/lib/api';
import { styles } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import COAPropertiesDialog from '@/components/COAPropertiesDialog';
import COAUploadDialog from '@/components/COAUploadDialog';
import COALinkDialog from '@/components/COALinkDialog';
import type { COAWithSignal, Movement } from '@/lib/types';

interface COAGridRow {
  id: string;
  nomination_key: string | null;
  signal_id: string | null;
  signal_name: string | null;
  analysis_date: string | null;
  bmci: number | null;
  sulfur_content: number | null;
  created_at: string;
}

export default function COAPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCOA, setSelectedCOA] = useState<COAWithSignal | null>(null);

  const { data: coas, isLoading: coasLoading } = useQuery({
    queryKey: ['coas'],
    queryFn: () => coaApi.getAll(),
  });

  const { data: signals } = useQuery({
    queryKey: ['all-movements'],
    queryFn: () => movementsApi.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, signalId }: { file: File; signalId?: string }) =>
      coaApi.upload(file, signalId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['coas'] });
      const linkedMsg = result.signal_id ? ` and linked to signal ${result.signal?.signal_id || result.signal_id}` : '';
      setSuccessMessage(`COA uploaded successfully${linkedMsg}`);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccessMessage(null);
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ coaId, signalId }: { coaId: string; signalId: string }) =>
      coaApi.link(coaId, { signal_id: signalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coas'] });
      setSuccessMessage('COA linked to signal successfully');
      setError(null);
      setLinkDialogOpen(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coas'] });
      setSuccessMessage('COA deleted successfully');
      setError(null);
      setDeleteDialogOpen(false);
      setSelectedCOA(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleUpload = async (file: File, signalId?: string) => {
    await uploadMutation.mutateAsync({ file, signalId });
  };

  const handleLink = async (coaId: string, signalId: string) => {
    await linkMutation.mutateAsync({ coaId, signalId });
  };

  const handleDelete = () => {
    if (selectedCOA) {
      deleteMutation.mutate(selectedCOA.id);
    }
  };

  const handleOpenProperties = (coa: COAWithSignal) => {
    setSelectedCOA(coa);
    setPropertiesDialogOpen(true);
  };

  const handleOpenLink = (coa: COAWithSignal) => {
    setSelectedCOA(coa);
    setLinkDialogOpen(true);
  };

  const handleOpenDelete = (coa: COAWithSignal) => {
    setSelectedCOA(coa);
    setDeleteDialogOpen(true);
  };

  // Get signals that have trade info for linking
  const signalsWithTrade = (signals || []).filter(
    (s: Movement) => s.trade_number && s.trade_line_item
  );

  const rows: COAGridRow[] = (coas || []).map((coa) => ({
    id: coa.id,
    nomination_key: coa.nomination_key || null,
    signal_id: coa.signal_id || null,
    signal_name: coa.signal?.signal_id || null,
    analysis_date: coa.analysis_date || null,
    bmci: coa.bmci || null,
    sulfur_content: coa.sulfur_content || null,
    created_at: coa.created_at,
  }));

  const columns: GridColDef[] = [
    {
      field: 'nomination_key',
      headerName: 'Nomination Key',
      minWidth: 140,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography sx={{ fontWeight: 600, color: 'var(--color-accent-cyan)' }} noWrap>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'signal_name',
      headerName: 'Linked Signal',
      minWidth: 120,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 230, 118, 0.15)',
              color: '#00e676',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        ) : (
          <Chip
            label="Unlinked"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 179, 0, 0.15)',
              color: '#ffb300',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        ),
    },
    {
      field: 'analysis_date',
      headerName: 'Analysis Date',
      minWidth: 100,
      flex: 0.7,
      renderCell: (params: GridRenderCellParams) => (
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {params.value ? formatDate(params.value) : '—'}
        </Typography>
      ),
    },
    {
      field: 'bmci',
      headerName: 'BMCI',
      minWidth: 80,
      flex: 0.5,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            fontWeight: 600,
            fontFamily: 'monospace',
            color: params.value ? 'text.primary' : 'text.disabled',
          }}
          noWrap
        >
          {params.value?.toFixed(1) || '—'}
        </Typography>
      ),
    },
    {
      field: 'sulfur_content',
      headerName: 'Sulfur %',
      minWidth: 80,
      flex: 0.5,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            fontWeight: 600,
            fontFamily: 'monospace',
            color: params.value ? 'text.primary' : 'text.disabled',
          }}
          noWrap
        >
          {params.value?.toFixed(2) || '—'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Uploaded',
      minWidth: 100,
      flex: 0.7,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams) => {
        const coa = coas?.find((c) => c.id === params.row.id);
        if (!coa) return null;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleOpenProperties(coa)}
              sx={{ color: 'var(--color-accent-cyan)' }}
              title="View Properties"
            >
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {!coa.signal_id && (
              <IconButton
                size="small"
                onClick={() => handleOpenLink(coa)}
                sx={{ color: '#8b5cf6' }}
                title="Link to Signal"
              >
                <LinkIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => handleOpenDelete(coa)}
              sx={{ color: '#ff5252' }}
              title="Delete"
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  if (coasLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  const linkedCount = coas?.filter((c) => c.signal_id).length || 0;
  const unlinkedCount = (coas?.length || 0) - linkedCount;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}
        >
          Certificate of Analysis
        </Typography>
        <Box
          sx={{ width: 60, height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.35)' }}
        />
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            TOTAL COAs
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
            {coas?.length || 0}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            LINKED
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#00e676' }}>
            {linkedCount}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(10, 15, 26, 0.9)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
            UNLINKED
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffb300' }}>
            {unlinkedCount}
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2, bgcolor: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)' }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Upload Card */}
        <Card
          sx={{
            background: styles.cardGradient,
            borderLeft: '2px solid var(--color-accent-cyan)',
            boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: 'var(--color-accent-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  fontSize: '0.65rem',
                }}
              >
                Upload COA
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Upload a Certificate of Analysis PDF to extract chemical properties
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                bgcolor: 'rgba(0, 230, 118, 0.1)',
                color: '#00e676',
                border: '1px solid #00e676',
                '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
              }}
            >
              Upload PDF
            </Button>
          </CardContent>
        </Card>

        {/* COA Table */}
        <Box>
          <SectionHeader title="All Certificates" />
          <Box sx={{ mt: 2 }}>
            {rows.length === 0 ? (
              <EmptyState
                icon={<ScienceIcon />}
                title="No Certificates"
                description="Upload a Certificate of Analysis PDF to get started."
                action={{
                  label: 'Upload COA',
                  onClick: () => setUploadDialogOpen(true),
                }}
              />
            ) : (
              <Box sx={{ height: 520, width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 20, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                  sx={{
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
                    '& .MuiDataGrid-row': {
                      '&:nth-of-type(even)': {
                        backgroundColor: alpha('#00e5ff', 0.02),
                      },
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(0, 229, 255, 0.04)',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid rgba(0, 229, 255, 0.15)',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Dialogs */}
      <COAUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
        signals={signalsWithTrade}
        isUploading={uploadMutation.isPending}
      />

      <COAPropertiesDialog
        open={propertiesDialogOpen}
        onClose={() => setPropertiesDialogOpen(false)}
        coa={selectedCOA}
      />

      <COALinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onLink={handleLink}
        coa={selectedCOA}
        signals={signalsWithTrade}
        isLinking={linkMutation.isPending}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Certificate"
        message={`Are you sure you want to delete this Certificate of Analysis${selectedCOA?.nomination_key ? ` (${selectedCOA.nomination_key})` : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedCOA(null);
        }}
      />
    </Box>
  );
}
