'use client';

import { Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export default function KeyboardShortcutsDialog({ open, onClose, shortcuts }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backgroundImage: 'linear-gradient(135deg, rgba(18, 26, 39, 0.92), rgba(10, 14, 23, 0.9))',
            boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
            backdropFilter: 'blur(18px)',
            borderRadius: '16px'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Keyboard Shortcuts
        </Typography>
        <IconButton onClick={onClose} aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shortcuts.map((shortcut, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                px: 2,
                borderRadius: '8px',
                bgcolor: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.1)'
              }}
            >
              <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                {shortcut.description}
              </Typography>
              <Chip
                label={shortcut.key}
                icon={<KeyboardReturnIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: 'rgba(0, 229, 255, 0.15)',
                  color: 'var(--color-accent-cyan)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(0, 229, 255, 0.3)'
                }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
