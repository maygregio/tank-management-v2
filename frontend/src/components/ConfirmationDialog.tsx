'use client';

import {
  Button,
  Box,
  Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DialogScaffold from '@/components/DialogScaffold';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  loading?: boolean;
}

const variantConfig = {
  warning: {
    icon: <WarningIcon />,
    iconColor: 'warning.main',
    confirmColor: '#ffb300',
    confirmBg: 'rgba(255, 179, 0, 0.1)',
    confirmBorder: 'rgba(255, 179, 0, 0.3)'
  },
  danger: {
    icon: <DeleteIcon />,
    iconColor: 'error.main',
    confirmColor: '#ff5252',
    confirmBg: 'rgba(255, 82, 82, 0.1)',
    confirmBorder: 'rgba(255, 82, 82, 0.3)'
  },
  info: {
    icon: <CheckCircleIcon />,
    iconColor: 'success.main',
    confirmColor: '#00e676',
    confirmBg: 'rgba(0, 230, 118, 0.1)',
    confirmBorder: 'rgba(0, 230, 118, 0.3)'
  }
} as const;

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];

  return (
    <DialogScaffold
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: '16px' },
        },
      }}
      actions={(
        <>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              px: 3
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            sx={{
              bgcolor: config.confirmBg,
              color: config.confirmColor,
              border: `1px solid ${config.confirmBorder}`,
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: variant === 'danger'
                  ? 'rgba(255, 82, 82, 0.2)'
                  : variant === 'warning'
                  ? 'rgba(255, 179, 0, 0.2)'
                  : 'rgba(0, 230, 118, 0.2)'
              },
              '&:disabled': { opacity: 0.3 }
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </>
      )}
      actionsSx={{ borderTop: 'none', p: 3, gap: 1.5, justifyContent: 'center' }}
      contentSx={{ pt: 2, pb: 0 }}
    >
      <Box sx={{ textAlign: 'center', pt: 1, pb: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: variant === 'danger'
              ? 'rgba(255, 82, 82, 0.1)'
              : variant === 'warning'
              ? 'rgba(255, 179, 0, 0.1)'
              : 'rgba(0, 230, 118, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}
        >
          <Box sx={{ fontSize: 32, color: config.iconColor }}>
            {config.icon}
          </Box>
        </Box>
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'text.primary',
            pb: 1
          }}
        >
          {title}
        </Typography>
        {message && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            {message}
          </Typography>
        )}
      </Box>
    </DialogScaffold>
  );
}
