'use client';

import { createContext, useContext, useCallback } from 'react';
import { useSnackbar, OptionsObject, VariantType } from 'notistack';

interface ToastContextValue {
  success: (message: string, options?: OptionsObject) => void;
  error: (message: string, options?: OptionsObject) => void;
  warning: (message: string, options?: OptionsObject) => void;
  info: (message: string, options?: OptionsObject) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar } = useSnackbar();

  const notify = useCallback(
    (message: string, variant: VariantType, options?: OptionsObject) => {
      enqueueSnackbar(message, { variant, ...options });
    },
    [enqueueSnackbar]
  );

  const success = useCallback((m: string, o?: OptionsObject) => notify(m, 'success', o), [notify]);
  const error = useCallback((m: string, o?: OptionsObject) => notify(m, 'error', o), [notify]);
  const warning = useCallback((m: string, o?: OptionsObject) => notify(m, 'warning', o), [notify]);
  const info = useCallback((m: string, o?: OptionsObject) => notify(m, 'info', o), [notify]);

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
