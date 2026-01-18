'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, forwardRef } from 'react';
import { SnackbarProvider, CustomContentProps } from 'notistack';
import { ToastProvider } from '@/contexts/ToastContext';
import theme from '@/lib/theme';

interface SnackbarStyleConfig {
  background: string;
  border: string;
  color: string;
  boxShadow: string;
}

const snackbarStyles: Record<'success' | 'error' | 'warning' | 'info', SnackbarStyleConfig> = {
  success: {
    background: 'rgba(0, 230, 118, 0.12)',
    border: '1px solid rgba(0, 230, 118, 0.3)',
    color: '#00e676',
    boxShadow: '0 4px 12px rgba(0, 230, 118, 0.15)',
  },
  error: {
    background: 'rgba(255, 82, 82, 0.12)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    color: '#ff5252',
    boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)',
  },
  warning: {
    background: 'rgba(255, 179, 0, 0.12)',
    border: '1px solid rgba(255, 179, 0, 0.3)',
    color: '#ffb300',
    boxShadow: '0 4px 12px rgba(255, 179, 0, 0.15)',
  },
  info: {
    background: 'rgba(0, 229, 255, 0.12)',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    color: '#00e5ff',
    boxShadow: '0 4px 12px rgba(0, 229, 255, 0.15)',
  },
};

const createSnackbarComponent = (variant: 'success' | 'error' | 'warning' | 'info') => {
  const SnackbarComponent = forwardRef<HTMLDivElement, CustomContentProps>(
    ({ message }, ref) => {
      const styles = snackbarStyles[variant];
      return (
        <div
          ref={ref}
          style={{
            ...styles,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            backdropFilter: 'blur(10px)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      );
    }
  );
  SnackbarComponent.displayName = `Snackbar${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  return SnackbarComponent;
};

const snackbarComponents = {
  success: createSnackbarComponent('success'),
  error: createSnackbarComponent('error'),
  warning: createSnackbarComponent('warning'),
  info: createSnackbarComponent('info'),
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={4000}
          Components={snackbarComponents}
        >
          <ToastProvider>
            <CssBaseline />
            {children}
          </ToastProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
