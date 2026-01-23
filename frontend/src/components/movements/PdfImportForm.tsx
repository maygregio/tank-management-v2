'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { importsApi } from '@/lib/api';
import { styles, movementTypeLabels, movementTypeColors, movementTypeChipColors } from '@/lib/constants';
import type {
  MovementType,
  TankWithLevel,
  PDFExtractionResult,
  PDFMovementWithMatches,
  PDFImportConfirmItem,
} from '@/lib/types';

interface SelectedMovement {
  fileIndex: number;
  movementIndex: number;
  tankId: string;
  type: MovementType;
  volume: number;
  date: string;
  notes?: string;
}

const pdfImportSteps = ['Upload PDFs', 'Review & Match', 'Confirm Import'];

interface PdfImportFormProps {
  tanks: TankWithLevel[];
}

export default function PdfImportForm({ tanks }: PdfImportFormProps) {
  const queryClient = useQueryClient();
  const [pdfStep, setPdfStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [extractionResults, setExtractionResults] = useState<PDFExtractionResult[]>([]);
  const [selectedPdfMovements, setSelectedPdfMovements] = useState<Map<string, SelectedMovement>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const extractMutation = useMutation({
    mutationFn: importsApi.extractFromPDFs,
    onSuccess: (results) => {
      setExtractionResults(results);
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
      setSelectedPdfMovements(newSelections);
      setPdfStep(1);
    },
  });

  const importMutation = useMutation({
    mutationFn: importsApi.confirmImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      setPdfStep(2);
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

  const handleTogglePdfMovement = (fileIndex: number, movementIndex: number, movement: PDFMovementWithMatches, filename: string) => {
    const key = `${fileIndex}-${movementIndex}`;
    const newSelections = new Map(selectedPdfMovements);

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
    setSelectedPdfMovements(newSelections);
  };

  const handleChangeTank = (key: string, tankId: string, filename: string) => {
    const selection = selectedPdfMovements.get(key);
    if (selection) {
      setSelectedPdfMovements(new Map(selectedPdfMovements).set(key, {
        ...selection,
        tankId,
        notes: `Imported from PDF: ${filename}`,
      }));
    }
  };

  const handleImport = () => {
    const pdfMovements: PDFImportConfirmItem[] = Array.from(selectedPdfMovements.values()).map((s) => ({
      tank_id: s.tankId,
      type: s.type,
      volume: s.volume,
      date: s.date,
      notes: s.notes,
    }));
    importMutation.mutate({ movements: pdfMovements });
  };

  const handlePdfReset = () => {
    setPdfStep(0);
    setFiles([]);
    setExtractionResults([]);
    setSelectedPdfMovements(new Map());
  };

  const renderUploadStep = () => (
    <Box sx={{ mt: 2 }}>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'var(--color-border)',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: dragActive ? 'rgba(0, 212, 255, 0.05)' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('pdf-file-input')?.click()}
      >
        <input
          id="pdf-file-input"
          type="file"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'var(--color-accent-cyan)', mb: 1 }} />
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Drag & drop PDF files here
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          or click to select files
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem' }}>
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
                  p: 1,
                  mb: 0.5,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont }}>
                    {file.name}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  sx={{ color: 'error.main', minWidth: 'auto', fontSize: '0.65rem' }}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={handleExtract}
          disabled={files.length === 0 || extractMutation.isPending}
          startIcon={extractMutation.isPending ? <CircularProgress size={14} /> : undefined}
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
        <Alert severity="error" sx={{ mt: 2 }}>
          {extractMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  const renderReviewStep = () => (
    <Box sx={{ mt: 2 }}>
      {extractionResults.map((result, fileIndex) => (
        <Box key={fileIndex} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.65rem', mb: 1, display: 'block' }}>
            {result.filename}
          </Typography>

          {result.extraction_errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
              {result.extraction_errors.join(', ')}
            </Alert>
          )}

          {result.movements.length > 0 ? (
            <TableContainer sx={{ border: '1px solid var(--glass-border)', bgcolor: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={styles.tableHeadRow}>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontSize: '0.7rem' }}>Tank</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Match To</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem' }}>Volume</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Type</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.movements.map((movement, movementIndex) => {
                    const key = `${fileIndex}-${movementIndex}`;
                    const isSelected = selectedPdfMovements.has(key);
                    const selection = selectedPdfMovements.get(key);
                    const typeColor = movementTypeColors[movement.movement_type];
                    const chipColor = movementTypeChipColors[typeColor];
                    const suggestedMatchIds = new Set(
                      movement.suggested_matches.map((match) => match.tank_id)
                    );
                    const extraTankOptions = tanks.filter(
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
                            onChange={() => handleTogglePdfMovement(fileIndex, movementIndex, movement, result.filename)}
                            disabled={movement.suggested_matches.length === 0}
                            sx={{
                              color: 'var(--color-border)',
                              '&.Mui-checked': { color: 'var(--color-accent-cyan)' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont }}>
                            {movement.extracted.tank_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {movement.suggested_matches.length > 0 ? (
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <Select
                                value={selection?.tankId || movement.best_match?.tank_id || ''}
                                onChange={(e) => {
                                  if (!isSelected && movement.best_match) {
                                    handleTogglePdfMovement(fileIndex, movementIndex, movement, result.filename);
                                  }
                                  handleChangeTank(key, e.target.value, result.filename);
                                }}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {movement.suggested_matches.map((match) => (
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
                            <Typography sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                              No match
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: '0.75rem', fontFamily: styles.monoFont, fontWeight: 600 }}>
                            {movement.extracted.movement_qty.toLocaleString()} bbl
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: '6px',
                              bgcolor: chipColor.bg,
                              color: chipColor.text,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {movementTypeLabels[movement.movement_type]}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {movement.best_match && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {movement.is_exact_match ? (
                                <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              ) : (
                                <ErrorOutlineIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                              )}
                              <Typography sx={{ fontSize: '0.7rem', color: movement.is_exact_match ? 'success.main' : 'warning.main' }}>
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
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              No movements extracted from this file.
            </Typography>
          )}
        </Box>
      ))}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handlePdfReset} sx={{ color: 'text.secondary' }}>
          Start Over
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={selectedPdfMovements.size === 0 || importMutation.isPending}
          startIcon={importMutation.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {importMutation.isPending ? 'Importing...' : `Import ${selectedPdfMovements.size} Movement${selectedPdfMovements.size !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {importMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {importMutation.error.message}
        </Alert>
      )}
    </Box>
  );

  const renderConfirmStep = () => (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Import Complete
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: '0.85rem' }}>
        Successfully created {selectedPdfMovements.size} movement{selectedPdfMovements.size !== 1 ? 's' : ''}.
      </Typography>
      <Button
        variant="contained"
        onClick={handlePdfReset}
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
    <Card sx={{
      background: styles.cardGradient,
      borderLeft: '2px solid #a78bfa',
      boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
    }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Import from PDF
        </Typography>

        <Stepper activeStep={pdfStep} sx={{ mb: 2 }}>
          {pdfImportSteps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.65rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  },
                  '& .MuiStepIcon-root.Mui-active': {
                    color: '#a78bfa',
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

        {pdfStep === 0 && renderUploadStep()}
        {pdfStep === 1 && renderReviewStep()}
        {pdfStep === 2 && renderConfirmStep()}
      </CardContent>
    </Card>
  );
}
