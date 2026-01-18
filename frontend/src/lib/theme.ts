'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
      light: '#5cf4ff',
      dark: '#00b3cc',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#b794ff',
      dark: '#5a34c7',
    },
    warning: {
      main: '#ffb300',
      light: '#ffd54f',
      dark: '#ff8f00',
    },
    error: {
      main: '#ff5252',
      light: '#ff867f',
      dark: '#c50e29',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248',
    },
    background: {
      default: '#0b1018',
      paper: 'rgba(15, 22, 34, 0.85)',
    },
    text: {
      primary: '#e9f0f7',
      secondary: '#9aa7b4',
    },
    divider: 'rgba(0, 229, 255, 0.16)',
  },
};

const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#00b3cc',
      light: '#5cd4f4',
      dark: '#008399',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#b794ff',
      dark: '#5a34c7',
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
    },
    error: {
      main: '#d32f2f',
      light: '#ff6659',
      dark: '#9a0007',
    },
    success: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    divider: 'rgba(0, 179, 204, 0.2)',
  },
};

const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
    },
    body2: {
      color: 'inherit',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 22, 34, 0.92)',
          border: '1px solid rgba(0, 229, 255, 0.18)',
          boxShadow: '0 20px 60px rgba(5, 10, 18, 0.55)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 229, 255, 0.08)',
        },
      },
    },
  },
};

function createCustomTheme(mode: 'dark' | 'light') {
  const baseTheme = mode === 'dark' ? darkTheme : lightTheme;

  return createTheme({
    ...baseTheme,
    ...commonThemeOptions,
    palette: {
      ...baseTheme.palette,
      ...commonThemeOptions.palette,
    },
  });
}

export default createCustomTheme;
