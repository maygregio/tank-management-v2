'use client';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { styles } from '@/lib/constants';

interface DialogScaffoldProps extends Omit<DialogProps, 'title'> {
  title?: React.ReactNode;
  titleColor?: string;
  titleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DialogScaffold({
  title,
  titleColor = 'var(--color-accent-cyan)',
  titleSx,
  contentSx,
  actionsSx,
  children,
  actions,
  ...dialogProps
}: DialogScaffoldProps) {
  const paperSlotProps = dialogProps.slotProps?.paper;
  const mergedPaperSx = Array.isArray(paperSlotProps?.sx)
    ? [styles.dialogPaper, ...paperSlotProps.sx]
    : [styles.dialogPaper, paperSlotProps?.sx].filter(Boolean);

  return (
    <Dialog
      {...dialogProps}
      slotProps={{
        ...dialogProps.slotProps,
        paper: {
          ...paperSlotProps,
          sx: mergedPaperSx,
        },
      }}
    >
      {title !== undefined && (
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2, ...titleSx }}>
          {typeof title === 'string' ? (
            <Typography
              variant="overline"
              sx={{ color: titleColor, fontWeight: 700, letterSpacing: '0.15em' }}
            >
              {title}
            </Typography>
          ) : (
            title
          )}
        </DialogTitle>
      )}
      <DialogContent sx={{ pt: 3, ...contentSx }}>{children}</DialogContent>
      {actions && (
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2, ...actionsSx }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
