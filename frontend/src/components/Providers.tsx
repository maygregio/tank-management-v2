'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, forwardRef, useMemo } from 'react';
import { SnackbarProvider, CustomContentProps } from 'notistack';
import { useThemeMode } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import createCustomTheme from '@/lib/theme';

interface SnackbarStyleConfig {
  background: string;
  border: string;
  color: string;
  boxShadow: string;
}

function getSnackbarStyles(variant: 'success' | 'error' | 'warning' | 'info', mode: 'light' | 'dark'): SnackbarStyleConfig {
  const configs = {
    success: {
      dark: {
        background: 'rgba(0, 230, 118, 0.12)',
        border: '1px solid rgba(0, 230, 118, 0.3)',
        color: '#00e676',
        boxShadow: '0 4px 12px rgba(0, 230, 118, 0.15)',
      },
      light: {
        background: 'rgba(46, 125, 50, 0.12)',
        border: '1px solid rgba(46, 125, 50, 0.3)',
        color: '#2e7d32',
        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
      },
    },
    error: {
      dark: {
        background: 'rgba(255, 82, 82, 0.12)',
        border: '1px solid rgba(255, 82, 82, 0.3)',
        color: '#ff5252',
        boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)',
      },
      light: {
        background: 'rgba(211, 47, 47, 0.12)',
        border: '1px solid rgba(211, 47, 47, 0.3)',
        color: '#d32f2f',
        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
      },
    },
    warning: {
      dark: {
        background: 'rgba(255, 179, 0, 0.12)',
        border: '1px solid rgba(255, 179, 0, 0.3)',
        color: '#ffb300',
        boxShadow: '0 4px 12px rgba(255, 179, 0, 0.15)',
      },
      light: {
        background: 'rgba(255, 152, 0, 0.12)',
        border: '1px solid rgba(255, 152, 0, 0.3)',
        color: '#ff9800',
        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
      },
    },
    info: {
      dark: {
        background: 'rgba(0, 229, 255, 0.12)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        color: '#00e5ff',
        boxShadow: '0 4px 12px rgba(0, 229, 255, 0.15)',
      },
      light: {
        background: 'rgba(0, 179, 204, 0.12)',
        border: '1px solid rgba(0, 179, 204, 0.3)',
        color: '#00b3cc',
        boxShadow: '0 4px 12px rgba(0, 179, 204, 0.15)',
      },
    },
  };
  return configs[variant][mode];
}

const createSnackbarComponent = (variant: 'success' | 'error' | 'warning' | 'info', mode: 'light' | 'dark') => {
  const SnackbarComponent = forwardRef<HTMLDivElement, CustomContentProps>(
    ({ message }, ref) => {
      const styles = getSnackbarStyles(variant, mode);
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

function ThemeProviders({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = createCustomTheme(mode);

  const snackbarComponents = useMemo(() => ({
    success: createSnackbarComponent('success', mode),
    error: createSnackbarComponent('error', mode),
    warning: createSnackbarComponent('warning', mode),
    info: createSnackbarComponent('info', mode),
  }), [mode]);

  return (
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
  );
}

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
      <ThemeProviders>{children}</ThemeProviders>
    </QueryClientProvider>
  );
}
