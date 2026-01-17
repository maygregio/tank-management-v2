'use client';

import { useThemeMode } from '@/contexts/ThemeContext';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleMode}
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'var(--color-accent-cyan)',
            bgcolor: 'rgba(0, 229, 255, 0.05)'
          }
        }}
      >
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
