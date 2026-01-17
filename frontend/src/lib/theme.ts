'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
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
      color: '#9aa7b4',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(15, 22, 34, 0.92) 0%, rgba(12, 18, 30, 0.88) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.18)',
          boxShadow: '0 20px 60px rgba(5, 10, 18, 0.55)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, rgba(12, 18, 30, 0.85), rgba(14, 20, 32, 0.9))',
          backgroundColor: 'rgba(12, 18, 30, 0.9)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(12, 18, 30, 0.95)',
          backgroundImage: 'linear-gradient(180deg, rgba(18, 25, 40, 0.95) 0%, rgba(10, 14, 23, 0.96) 100%)',
          borderRight: '1px solid rgba(0, 229, 255, 0.14)',
          backdropFilter: 'blur(18px)',
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
          backgroundImage: 'linear-gradient(90deg, rgba(0, 229, 255, 0.08), rgba(139, 92, 246, 0.12))',
        },
      },
    },
  },
});

export default theme;
