'use client';

import { createContext, useContext, useCallback } from 'react';
import { useSnackbar, SnackbarMessage } from 'notistack';

interface ToastContextValue {
  success: (message: string, options?: Partial<SnackbarMessage>) => void;
  error: (message: string, options?: Partial<SnackbarMessage>) => void;
  warning: (message: string, options?: Partial<SnackbarMessage>) => void;
  info: (message: string, options?: Partial<SnackbarMessage>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar } = useSnackbar();

  const success = useCallback(
    (message: string, options?: Partial<SnackbarMessage>) => {
      enqueueSnackbar(message, {
        variant: 'success',
        ...options,
      });
    },
    [enqueueSnackbar]
  );

  const error = useCallback(
    (message: string, options?: Partial<SnackbarMessage>) => {
      enqueueSnackbar(message, {
        variant: 'error',
        ...options,
      });
    },
    [enqueueSnackbar]
  );

  const warning = useCallback(
    (message: string, options?: Partial<SnackbarMessage>) => {
      enqueueSnackbar(message, {
        variant: 'warning',
        ...options,
      });
    },
    [enqueueSnackbar]
  );

  const info = useCallback(
    (message: string, options?: Partial<SnackbarMessage>) => {
      enqueueSnackbar(message, {
        variant: 'info',
        ...options,
      });
    },
    [enqueueSnackbar]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
