'use client';

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { Movement } from '@/lib/types';

interface COAUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, signalId?: string) => Promise<void>;
  signals: Movement[];
  isUploading: boolean;
}

export default function COAUploadDialog({
  open,
  onClose,
  onUpload,
  signals,
  isUploading,
}: COAUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile, selectedSignalId || undefined);
      handleClose();
    } catch {
      setError('Upload failed. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedSignalId('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  // Filter signals that have trade info (nomination key can be derived)
  const signalsWithTrade = signals.filter(s => s.trade_number && s.trade_line_item);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(18, 26, 39, 0.95)',
            boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
            backdropFilter: 'blur(18px)',
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em' }}
        >
          Upload Certificate of Analysis
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Drop Zone */}
        <Box
          sx={{
            border: `2px dashed ${dragOver ? 'var(--color-accent-cyan)' : 'var(--color-border)'}`,
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            bgcolor: dragOver ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
            '&:hover': {
              borderColor: 'var(--color-accent-cyan)',
              bgcolor: 'rgba(0, 229, 255, 0.05)',
            },
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {selectedFile ? (
            <Box>
              <PictureAsPdfIcon sx={{ fontSize: 48, color: '#ff5252', mb: 2 }} />
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{selectedFile.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 1, color: 'var(--color-accent-cyan)', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Click to change file
              </Typography>
            </Box>
          ) : (
            <Box>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'var(--color-accent-cyan)', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Drop PDF here or click to upload
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Certificate of Analysis documents only
              </Typography>
            </Box>
          )}
        </Box>

        {/* Signal Selection */}
        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Link to Signal (Optional)</InputLabel>
            <Select
              value={selectedSignalId}
              label="Link to Signal (Optional)"
              onChange={(e) => setSelectedSignalId(e.target.value)}
            >
              <MenuItem value="">
                <em>Auto-detect from document</em>
              </MenuItem>
              {signalsWithTrade.map((signal) => (
                <MenuItem key={signal.id} value={signal.id}>
                  {signal.signal_id} - {signal.trade_number}/{signal.trade_line_item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
            If not selected, the system will try to match using the nomination key extracted from the document.
          </Typography>
        </Box>

        {/* Info Box */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Properties extracted:
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
            BMCI, API Gravity, Specific Gravity, Viscosity, Sulfur Content, Flash Point, Ash Content,
            Moisture Content, Toluene Insoluble, Sodium Content
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || isUploading}
          startIcon={isUploading ? <CircularProgress size={16} /> : undefined}
          sx={{
            bgcolor: 'rgba(0, 230, 118, 0.1)',
            color: '#00e676',
            border: '1px solid #00e676',
            '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
            '&:disabled': { opacity: 0.3 },
          }}
        >
          {isUploading ? 'Processing...' : 'Upload & Extract'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
