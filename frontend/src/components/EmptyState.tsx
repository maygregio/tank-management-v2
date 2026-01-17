'use client';

import { Box, Typography, Button } from '@mui/material';
import { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const actionProps = action?.href
    ? { component: Link, href: action.href }
    : { onClick: action?.onClick };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center'
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            opacity: 0.5,
            mb: 3
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        variant="h6"
        sx={{
          mb: 1,
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            maxWidth: 400,
            mb: 3
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          {...actionProps}
          sx={{
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--color-accent-cyan)',
            border: '1px solid var(--color-accent-cyan)',
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' }
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
