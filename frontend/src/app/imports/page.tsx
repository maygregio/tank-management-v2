'use client';

import { useMemo, useState, useCallback } from 'react';
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
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { importsApi, tanksApi } from '@/lib/api';
import { movementTypeLabels, movementTypeColors, movementTypeChipColors, styles } from '@/lib/constants';
import type { PDFExtractionResult, PDFMovementWithMatches, PDFImportConfirmItem, MovementType } from '@/lib/types';

const steps = ['Upload PDFs', 'Review & Match', 'Confirm Import'];

interface SelectedMovement {
  fileIndex: number;
  movementIndex: number;
  tankId: string;
  type: MovementType;
  volume: number;
  date: string;
  notes?: string;
}

export default function ImportsPage() {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [extractionResults, setExtractionResults] = useState<PDFExtractionResult[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<Map<string, SelectedMovement>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const { data: tanks } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const extractMutation = useMutation({
    mutationFn: importsApi.extractFromPDFs,
    onSuccess: (results) => {
      setExtractionResults(results);
      // Pre-select exact matches
      const newSelections = new Map<string, SelectedMovement>();
      results.forEach((result, fileIndex) => {
        result.movements.forEach((movement, movementIndex) => {
          const key = `${fileIndex}-${movementIndex}`;
          if (movement.is_exact_match && movement.best_match) {
            newSelections.set(key, {
              fileIndex,
              movementIndex,
              tankId: movement.best_match.tank_id,
              type: movement.movement_type,
              volume: movement.extracted.movement_qty,
              date: movement.extracted.movement_date || new Date().toISOString().split('T')[0],
              notes: `Imported from PDF: ${result.filename}`,
            });
          }
        });
      });
      setSelectedMovements(newSelections);
      setActiveStep(1);
    },
  });

  const importMutation = useMutation({
    mutationFn: importsApi.confirmImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
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

  const handleToggleMovement = (fileIndex: number, movementIndex: number, movement: PDFMovementWithMatches, filename: string) => {
    const key = `${fileIndex}-${movementIndex}`;
    const newSelections = new Map(selectedMovements);

    if (newSelections.has(key)) {
      newSelections.delete(key);
    } else if (movement.best_match) {
      newSelections.set(key, {
        fileIndex,
        movementIndex,
        tankId: movement.best_match.tank_id,
        type: movement.movement_type,
        volume: movement.extracted.movement_qty,
        date: movement.extracted.movement_date || new Date().toISOString().split('T')[0],
        notes: `Imported from PDF: ${filename}`,
      });
    }
    setSelectedMovements(newSelections);
  };

  const handleChangeTank = (key: string, tankId: string, filename: string) => {
    const selection = selectedMovements.get(key);
    if (selection) {
      setSelectedMovements(new Map(selectedMovements).set(key, {
        ...selection,
        tankId,
        notes: `Imported from PDF: ${filename}`,
      }));
    }
  };

  const handleImport = () => {
    const movements: PDFImportConfirmItem[] = Array.from(selectedMovements.values()).map((s) => ({
      tank_id: s.tankId,
      type: s.type,
      volume: s.volume,
      date: s.date,
      notes: s.notes,
    }));
    importMutation.mutate({ movements });
  };

  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setExtractionResults([]);
    setSelectedMovements(new Map());
  };

  const tankOptions = useMemo(() => (tanks || []), [tanks]);

  const renderUploadStep = () => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
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
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'var(--color-accent-cyan)', mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          Drag & drop PDF files here
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          or click to select files
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
          disabled={files.length === 0 || extractMutation.isPending}
          startIcon={extractMutation.isPending ? <CircularProgress size={16} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {extractMutation.isPending ? 'Extracting...' : 'Extract Data'}
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
            <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
              {result.filename}
            </Typography>
            <Box sx={{ width: 60, height: '1px', background: styles.headerSeparator }} />
          </Box>

          {result.extraction_errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {result.extraction_errors.join(', ')}
            </Alert>
          )}

          {result.movements.length > 0 ? (
            <TableContainer sx={{ border: '1px solid var(--glass-border)', bgcolor: 'var(--glass-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 48px rgba(5, 10, 18, 0.55)' }}>
              <Table size="small" sx={{ '& .MuiTableRow-root': { transition: 'background 0.25s ease' }, '& .MuiTableRow-root:hover': { bgcolor: 'rgba(0, 229, 255, 0.05)' }, '@media (prefers-reduced-motion: reduce)': { '& .MuiTableRow-root': { transition: 'none' } } }}>
                <TableHead>
                  <TableRow sx={styles.tableHeadRow}>
                    <TableCell padding="checkbox" />
                    <TableCell>Tank (Extracted)</TableCell>
                    <TableCell>Match To</TableCell>
                    <TableCell align="right">Before</TableCell>
                    <TableCell align="right">After</TableCell>
                    <TableCell align="right">Volume</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.movements.map((movement, movementIndex) => {
                    const key = `${fileIndex}-${movementIndex}`;
                    const isSelected = selectedMovements.has(key);
                    const selection = selectedMovements.get(key);
                    const typeColor = movementTypeColors[movement.movement_type];
                    const chipColor = movementTypeChipColors[typeColor];
                    const suggestedMatchIds = new Set(
                      movement.suggested_matches.map((match) => match.tank_id)
                    );
                    const extraTankOptions = tankOptions.filter(
                      (tank) => !suggestedMatchIds.has(tank.id)
                    );

                    return (
                      <TableRow
                        key={movementIndex}
                        sx={{
                          opacity: isSelected ? 1 : 0.6,
                          '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.06)' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleMovement(fileIndex, movementIndex, movement, result.filename)}
                            disabled={movement.suggested_matches.length === 0}
                            sx={{
                              color: 'var(--color-border)',
                              '&.Mui-checked': { color: 'var(--color-accent-cyan)' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
                            {movement.extracted.tank_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {movement.suggested_matches.length > 0 ? (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                              <Select
                                value={selection?.tankId || movement.best_match?.tank_id || ''}
                                onChange={(e) => {
                                  if (!isSelected && movement.best_match) {
                                    // Auto-select when changing tank
                                    handleToggleMovement(fileIndex, movementIndex, movement, result.filename);
                                  }
                                  handleChangeTank(key, e.target.value, result.filename);
                                }}
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {movement.suggested_matches.map((match) => (
                                  <MenuItem key={match.tank_id} value={match.tank_id}>
                                    {match.tank_name} ({match.confidence}%)
                                  </MenuItem>
                                ))}
                                {/* Add tanks not in suggestions */}
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
                            {movement.extracted.level_before.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
                            {movement.extracted.level_after.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont, fontWeight: 600 }}>
                            {movement.extracted.movement_qty.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              borderRadius: '6px',
                              bgcolor: chipColor.bg,
                              color: chipColor.text,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: '0 8px 18px rgba(5, 10, 18, 0.4)',
                            }}
                          >
                            {movementTypeLabels[movement.movement_type]}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {movement.best_match && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {movement.is_exact_match ? (
                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              ) : (
                                <ErrorOutlineIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              )}
                              <Typography sx={{ fontSize: '0.75rem', color: movement.is_exact_match ? 'success.main' : 'warning.main' }}>
                                {movement.best_match.confidence}%
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
              No movements extracted from this file.
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
          disabled={selectedMovements.size === 0 || importMutation.isPending}
          startIcon={importMutation.isPending ? <CircularProgress size={16} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {importMutation.isPending ? 'Importing...' : `Import ${selectedMovements.size} Movement${selectedMovements.size !== 1 ? 's' : ''}`}
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
        Successfully created {selectedMovements.size} movement{selectedMovements.size !== 1 ? 's' : ''}.
      </Typography>
      <Button
        variant="contained"
        onClick={handleReset}
        sx={{
          bgcolor: 'rgba(0, 212, 255, 0.1)',
          color: 'var(--color-accent-cyan)',
          border: '1px solid var(--color-accent-cyan)',
          '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
        }}
      >
        Import More
      </Button>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
          IMPORT MOVEMENTS
        </Typography>
        <Box sx={{ width: 60, height: '1px', background: styles.headerSeparatorCyan }} />
      </Box>

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
                  color: 'var(--color-accent-cyan)',
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
    </Box>
  );
}
