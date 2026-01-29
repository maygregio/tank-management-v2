'use client';

import type { DialogProps } from '@mui/material/Dialog';
import DialogScaffold from '@/components/DialogScaffold';

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
    <DialogScaffold
      {...dialogProps}
      title={title}
      titleColor={titleColor}
      actions={actions}
    >
      {children}
    </DialogScaffold>
  );
}
