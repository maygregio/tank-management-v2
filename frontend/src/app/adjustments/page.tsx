'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { adjustmentsApi, movementsApi, tanksApi } from '@/lib/api';
import { invalidateCommonQueries } from '@/lib/queryUtils';
import { styles } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';
import SectionHeader from '@/components/SectionHeader';
import type { AdjustmentExtractionResult, AdjustmentReadingWithMatches, AdjustmentImportConfirmItem } from '@/lib/types';

const steps = ['Upload PDF', 'Review & Match', 'Confirm Import'];

interface SelectedAdjustment {
  fileIndex: number;
  readingIndex: number;
  tankId: string;
  physicalLevel: number;
  inspectionDate: string;
  notes?: string;
  pdfUrl?: string;
}

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [extractionResults, setExtractionResults] = useState<AdjustmentExtractionResult[]>([]);
  const [selectedAdjustments, setSelectedAdjustments] = useState<Map<string, SelectedAdjustment>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: tanks } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', 'adjustment'],
    queryFn: () => movementsApi.getAll(undefined, 'adjustment'),
  });

  const extractMutation = useMutation({
    mutationFn: adjustmentsApi.extractFromPDFs,
    onSuccess: (results) => {
      setExtractionResults(results);
      // Store PDF URL from first result (assuming single file upload)
      if (results.length > 0 && results[0].pdf_url) {
        setPdfUrl(results[0].pdf_url);
      }
      // Pre-select exact matches
      const newSelections = new Map<string, SelectedAdjustment>();
      results.forEach((result, fileIndex) => {
        result.readings.forEach((reading, readingIndex) => {
          const key = `${fileIndex}-${readingIndex}`;
          if (reading.is_exact_match && reading.best_match) {
            newSelections.set(key, {
              fileIndex,
              readingIndex,
              tankId: reading.best_match.tank_id,
              physicalLevel: reading.extracted.physical_level,
              inspectionDate: reading.extracted.inspection_date || new Date().toISOString().split('T')[0],
              notes: `Imported from PDF: ${result.filename}`,
              pdfUrl: result.pdf_url || undefined,
            });
          }
        });
      });
      setSelectedAdjustments(newSelections);
      setActiveStep(1);
    },
  });

  const importMutation = useMutation({
    mutationFn: adjustmentsApi.confirmImport,
    onSuccess: () => {
      invalidateCommonQueries(queryClient);
      setActiveStep(2);
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf'
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtract = () => {
    if (files.length > 0) {
      extractMutation.mutate(files);
    }
  };

  const handleToggleAdjustment = (
    fileIndex: number,
    readingIndex: number,
    reading: AdjustmentReadingWithMatches,
    filename: string,
    filePdfUrl?: string
  ) => {
    const key = `${fileIndex}-${readingIndex}`;
    const newSelections = new Map(selectedAdjustments);

    if (newSelections.has(key)) {
      newSelections.delete(key);
    } else if (reading.best_match) {
      newSelections.set(key, {
        fileIndex,
        readingIndex,
        tankId: reading.best_match.tank_id,
        physicalLevel: reading.extracted.physical_level,
        inspectionDate: reading.extracted.inspection_date || new Date().toISOString().split('T')[0],
        notes: `Imported from PDF: ${filename}`,
        pdfUrl: filePdfUrl,
      });
    }
    setSelectedAdjustments(newSelections);
  };

  const handleChangeTank = (key: string, tankId: string, filename: string, filePdfUrl?: string) => {
    const selection = selectedAdjustments.get(key);
    if (selection) {
      setSelectedAdjustments(new Map(selectedAdjustments).set(key, {
        ...selection,
        tankId,
        notes: `Imported from PDF: ${filename}`,
        pdfUrl: filePdfUrl,
      }));
    }
  };

  const handleImport = () => {
    const adjustments: AdjustmentImportConfirmItem[] = Array.from(selectedAdjustments.values()).map((s) => ({
      tank_id: s.tankId,
      physical_level: s.physicalLevel,
      inspection_date: s.inspectionDate,
      notes: s.notes,
    }));
    importMutation.mutate({ adjustments, pdf_url: pdfUrl || undefined });
  };

  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setExtractionResults([]);
    setSelectedAdjustments(new Map());
    setPdfUrl(null);
  };

  const tankOptions = tanks || [];
  const tankMap = useMemo(() => new Map(tanks?.map((t) => [t.id, t]) || []), [tanks]);

  // Check if today is the first of the month
  const today = new Date();
  const isFirstOfMonth = today.getDate() === 1;

  const renderUploadStep = () => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      {!isFirstOfMonth && (
        <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(255, 171, 0, 0.1)', border: '1px solid rgba(255, 171, 0, 0.3)' }}>
          Adjustments can only be imported on the first day of the month. Today is {today.toLocaleDateString()}.
        </Alert>
      )}

      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'var(--color-border)',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          bgcolor: dragActive ? 'rgba(0, 212, 255, 0.05)' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          cursor: isFirstOfMonth ? 'pointer' : 'not-allowed',
          opacity: isFirstOfMonth ? 1 : 0.5,
        }}
        onClick={() => isFirstOfMonth && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={!isFirstOfMonth}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'var(--color-accent-cyan)', mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          Drag & drop monthly inspection PDF here
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          or click to select file
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
            SELECTED FILES ({files.length})
          </Typography>
          <Box sx={{ mt: 1 }}>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  mb: 1,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <UploadFileIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontFamily: styles.monoFont }}>
                    {file.name}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  sx={{ color: 'error.main', minWidth: 'auto', fontSize: '0.7rem' }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={handleExtract}
          disabled={files.length === 0 || extractMutation.isPending || !isFirstOfMonth}
          startIcon={extractMutation.isPending ? <CircularProgress size={16} /> : undefined}
          sx={{
            bgcolor: 'rgba(255, 171, 0, 0.1)',
            color: '#ffab00',
            border: '1px solid #ffab00',
            '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {extractMutation.isPending ? 'Extracting...' : 'Extract Readings'}
        </Button>
      </Box>

      {extractMutation.isError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {extractMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  const renderReviewStep = () => (
    <Box sx={{ mt: 3 }}>
      {extractionResults.map((result, fileIndex) => (
        <Box key={fileIndex} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="overline" sx={{ color: '#ffab00', fontWeight: 700, letterSpacing: '0.1em' }}>
              {result.filename}
            </Typography>
            {result.pdf_url && (
              <Tooltip title="View PDF">
                <IconButton
                  size="small"
                  onClick={() => {
                    // Extract blob name from URL
                    const url = new URL(result.pdf_url!);
                    const pathParts = url.pathname.split('/');
                    const blobName = pathParts.slice(2).join('/'); // Skip container name
                    window.open(adjustmentsApi.getPdfUrl(blobName), '_blank');
                  }}
                  sx={{ color: 'var(--color-accent-cyan)' }}
                >
                  <PictureAsPdfIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={{ width: 60, height: '1px', background: styles.headerSeparator }} />
          </Box>

          {result.extraction_errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {result.extraction_errors.join(', ')}
            </Alert>
          )}

          {result.readings.length > 0 ? (
            <TableContainer sx={{ border: '1px solid var(--glass-border)', bgcolor: 'var(--glass-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 48px rgba(5, 10, 18, 0.55)' }}>
              <Table size="small" sx={{ '& .MuiTableRow-root': { transition: 'background 0.25s ease' }, '& .MuiTableRow-root:hover': { bgcolor: 'rgba(0, 229, 255, 0.05)' }, '@media (prefers-reduced-motion: reduce)': { '& .MuiTableRow-root': { transition: 'none' } } }}>
                <TableHead>
                  <TableRow sx={styles.tableHeadRow}>
                    <TableCell padding="checkbox" />
                    <TableCell>Tank (Extracted)</TableCell>
                    <TableCell>Match To</TableCell>
                    <TableCell align="right">Physical Level</TableCell>
                    <TableCell align="right">System Level</TableCell>
                    <TableCell align="right">Delta</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.readings.map((reading, readingIndex) => {
                    const key = `${fileIndex}-${readingIndex}`;
                    const isSelected = selectedAdjustments.has(key);
                    const selection = selectedAdjustments.get(key);
                    const suggestedMatchIds = new Set(
                      reading.suggested_matches.map((match) => match.tank_id)
                    );
                    const extraTankOptions = tankOptions.filter(
                      (tank) => !suggestedMatchIds.has(tank.id)
                    );
                    const delta = reading.delta;
                    const isPositive = delta !== null && delta >= 0;

                    return (
                      <TableRow
                        key={readingIndex}
                        sx={{
                          opacity: isSelected ? 1 : 0.6,
                          '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.06)' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleAdjustment(fileIndex, readingIndex, reading, result.filename, result.pdf_url || undefined)}
                            disabled={reading.suggested_matches.length === 0}
                            sx={{
                              color: 'var(--color-border)',
                              '&.Mui-checked': { color: '#ffab00' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
                            {reading.extracted.tank_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {reading.suggested_matches.length > 0 ? (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                              <Select
                                value={selection?.tankId || reading.best_match?.tank_id || ''}
                                onChange={(e) => {
                                  if (!isSelected && reading.best_match) {
                                    handleToggleAdjustment(fileIndex, readingIndex, reading, result.filename, result.pdf_url || undefined);
                                  }
                                  handleChangeTank(key, e.target.value, result.filename, result.pdf_url || undefined);
                                }}
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {reading.suggested_matches.map((match) => (
                                  <MenuItem key={match.tank_id} value={match.tank_id}>
                                    {match.tank_name} ({match.confidence}%)
                                  </MenuItem>
                                ))}
                                {extraTankOptions.map((tank) => (
                                  <MenuItem key={tank.id} value={tank.id}>
                                    {tank.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>
                              No match found
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
                            {reading.extracted.physical_level.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont, color: 'text.secondary' }}>
                            {reading.system_level !== null ? `${reading.system_level.toLocaleString()} bbl` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {delta !== null ? (
                            <Chip
                              label={`${isPositive ? '+' : ''}${delta.toLocaleString()} bbl`}
                              size="small"
                              sx={{
                                bgcolor: isPositive ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                                color: isPositive ? '#00e676' : '#ff5252',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {reading.extracted.inspection_date || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {reading.best_match && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {reading.is_exact_match ? (
                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              ) : (
                                <ErrorOutlineIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              )}
                              <Typography sx={{ fontSize: '0.75rem', color: reading.is_exact_match ? 'success.main' : 'warning.main' }}>
                                {reading.best_match.confidence}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              No readings extracted from this file.
            </Typography>
          )}
        </Box>
      ))}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleReset} sx={{ color: 'text.secondary' }}>
          Start Over
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={selectedAdjustments.size === 0 || importMutation.isPending}
          startIcon={importMutation.isPending ? <CircularProgress size={16} /> : undefined}
          sx={{
            bgcolor: 'rgba(255, 171, 0, 0.1)',
            color: '#ffab00',
            border: '1px solid #ffab00',
            '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {importMutation.isPending ? 'Importing...' : `Import ${selectedAdjustments.size} Adjustment${selectedAdjustments.size !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {importMutation.isError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {importMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  const renderConfirmStep = () => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 6, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        Import Complete
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>
        Successfully created {selectedAdjustments.size} adjustment{selectedAdjustments.size !== 1 ? 's' : ''}.
      </Typography>
      <Button
        variant="contained"
        onClick={handleReset}
        sx={{
          bgcolor: 'rgba(255, 171, 0, 0.1)',
          color: '#ffab00',
          border: '1px solid #ffab00',
          '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
        }}
      >
        Import More
      </Button>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="overline" sx={{ color: '#ffab00', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          CALIBRATION PROTOCOL
        </Typography>
        <Box sx={{ width: 60, height: '1px', backgroundColor: 'rgba(255, 171, 0, 0.35)' }} />
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontSize: '0.75rem' }}>
        IMPORT MONTHLY INSPECTION READINGS FROM PDF
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    },
                    '& .MuiStepIcon-root.Mui-active': {
                      color: '#ffab00',
                    },
                    '& .MuiStepIcon-root.Mui-completed': {
                      color: 'success.main',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {activeStep === 0 && renderUploadStep()}
          {activeStep === 1 && renderReviewStep()}
          {activeStep === 2 && renderConfirmStep()}
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          {/* Calibration Log */}
          <Box sx={{ mb: 2 }}>
            <SectionHeader title="CALIBRATION LOG" color="warning" />
          </Box>

          <TableContainer component={Paper} sx={{ bgcolor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(16px)', boxShadow: '0 22px 50px rgba(5, 10, 18, 0.55)' }}>
            <Table size="small" sx={{ '& .MuiTableRow-root': { transition: 'background 0.25s ease' }, '& .MuiTableRow-root:nth-of-type(even)': { bgcolor: 'rgba(0, 229, 255, 0.02)' }, '& .MuiTableRow-root:hover': { bgcolor: 'rgba(0, 229, 255, 0.05)' }, '@media (prefers-reduced-motion: reduce)': { '& .MuiTableRow-root': { transition: 'none' } } }}>
              <TableHead>
                <TableRow sx={styles.tableHeadRow}>
                  <TableCell>Date</TableCell>
                  <TableCell>Tank</TableCell>
                  <TableCell align="right">Delta</TableCell>
                  <TableCell>PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem' }}>
                      No calibrations recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements?.slice(0, 20).map((movement) => {
                    const tank = movement.tank_id ? tankMap.get(movement.tank_id) : undefined;
                    const isPositive = (movement.actual_volume ?? 0) >= 0;
                    return (
                      <TableRow key={movement.id} sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(0, 229, 255, 0.1)', fontSize: '0.75rem', color: 'text.secondary' } }}>
                        <TableCell>
                          {formatDate(movement.created_at)}
                        </TableCell>
                        <TableCell>{tank?.name || 'Unknown'}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${isPositive ? '+' : ''}${(movement.actual_volume ?? 0).toLocaleString()} bbl`}
                            size="small"
                            sx={{
                              bgcolor: isPositive ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                              color: isPositive ? '#00e676' : '#ff5252',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {movement.pdf_url ? (
                            <Tooltip title="View source PDF">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const url = new URL(movement.pdf_url!);
                                  const pathParts = url.pathname.split('/');
                                  const blobName = pathParts.slice(2).join('/');
                                  window.open(adjustmentsApi.getPdfUrl(blobName), '_blank');
                                }}
                                sx={{ color: 'var(--color-accent-cyan)' }}
                              >
                                <PictureAsPdfIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
