'use client';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { styles } from '@/lib/constants';

interface GlassDialogProps extends Omit<DialogProps, 'title'> {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function GlassDialog({
  title,
  titleColor = 'var(--color-accent-cyan)',
  children,
  actions,
  ...dialogProps
}: GlassDialogProps) {
  return (
    <Dialog
      {...dialogProps}
      slotProps={{
        paper: {
          sx: styles.dialogPaper,
        },
        ...dialogProps.slotProps,
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: titleColor, fontWeight: 700, letterSpacing: '0.15em' }}
        >
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>{children}</DialogContent>
      {actions && (
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
