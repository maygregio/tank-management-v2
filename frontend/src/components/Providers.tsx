'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SnackbarProvider } from 'notistack';
import { useThemeMode } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import createCustomTheme from '@/lib/theme';

function ThemeProviders({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = createCustomTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4000}
          Components={{
            success: () => (
              <div
                style={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(0, 230, 118, 0.1))'
                    : 'linear-gradient(135deg, rgba(46, 125, 50, 0.15), rgba(46, 125, 50, 0.1))',
                  border: mode === 'dark'
                    ? '1px solid rgba(0, 230, 118, 0.3)'
                    : '1px solid rgba(46, 125, 50, 0.3)',
                  color: mode === 'dark' ? '#00e676' : '#2e7d32',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(0, 230, 118, 0.15)'
                    : '0 4px 12px rgba(46, 125, 50, 0.15)'
                }}
              >
                {message}
              </div>
            ),
            error: () => (
              <div
                style={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255, 82, 82, 0.15), rgba(255, 82, 82, 0.1))'
                    : 'linear-gradient(135deg, rgba(211, 47, 47, 0.15), rgba(211, 47, 47, 0.1))',
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 82, 82, 0.3)'
                    : '1px solid rgba(211, 47, 47, 0.3)',
                  color: mode === 'dark' ? '#ff5252' : '#d32f2f',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(255, 82, 82, 0.15)'
                    : '0 4px 12px rgba(211, 47, 47, 0.15)'
                }}
              >
                {message}
              </div>
            ),
            warning: () => (
              <div
                style={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255, 179, 0, 0.15), rgba(255, 179, 0, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 152, 0, 0.1))',
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 179, 0, 0.3)'
                    : '1px solid rgba(255, 152, 0, 0.3)',
                  color: mode === 'dark' ? '#ffb300' : '#ff9800',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(255, 179, 0, 0.15)'
                    : '0 4px 12px rgba(255, 152, 0, 0.15)'
                }}
              >
                {message}
              </div>
            ),
            info: () => (
              <div
                style={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(0, 229, 255, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 179, 204, 0.15), rgba(0, 179, 204, 0.1))',
                  border: mode === 'dark'
                    ? '1px solid rgba(0, 229, 255, 0.3)'
                    : '1px solid rgba(0, 179, 204, 0.3)',
                  color: mode === 'dark' ? '#00e5ff' : '#00b3cc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(0, 229, 255, 0.15)'
                    : '0 4px 12px rgba(0, 179, 204, 0.15)'
                }}
              >
                {message}
              </div>
            ),
          }}
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
