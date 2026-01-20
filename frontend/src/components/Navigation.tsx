'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CellTowerIcon from '@mui/icons-material/CellTower';
import ScienceIcon from '@mui/icons-material/Science';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import Tooltip from '@mui/material/Tooltip';
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog';
import MobileNavigation from '@/components/MobileNavigation';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { text: 'Tanks', href: '/tanks', Icon: PropaneTankIcon },
  { text: 'Movements', href: '/movements', Icon: SwapHorizIcon },
  { text: 'Signals', href: '/signals', Icon: CellTowerIcon },
  { text: 'COA', href: '/coa', Icon: ScienceIcon },
  { text: 'Adjustments', href: '/adjustments', Icon: TuneIcon },
  { text: 'Import PDF', href: '/imports', Icon: UploadFileIcon },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts([
    { key: '1', description: 'Go to Tanks', action: () => router.push('/tanks') },
    { key: '2', description: 'Go to Movements', action: () => router.push('/movements') },
    { key: '3', description: 'Go to Signals', action: () => router.push('/signals') },
    { key: '4', description: 'Go to COA', action: () => router.push('/coa') },
    { key: '5', description: 'Go to Adjustments', action: () => router.push('/adjustments') },
    { key: '6', description: 'Go to Import PDF', action: () => router.push('/imports') },
    { key: '?', description: 'Show keyboard shortcuts', action: () => setShortcutsOpen(true) },
  ]);

  const tabMenu = (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        px: { xs: 1.5, sm: 2.5 },
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'rgba(10, 12, 16, 0.6)',
        boxShadow: '0 12px 24px rgba(10, 12, 16, 0.18)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Box
            key={item.text}
            component={Link}
            href={item.href}
            aria-label={item.text}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.8,
              borderRadius: '999px',
              textDecoration: 'none',
              color: isActive ? 'text.primary' : 'text.secondary',
              border: '1px solid',
              borderColor: isActive ? 'rgba(0, 229, 255, 0.5)' : 'transparent',
              backgroundColor: isActive
                ? 'rgba(0, 229, 255, 0.12)'
                : 'transparent',
              boxShadow: isActive ? '0 0 16px rgba(0, 229, 255, 0.25)' : 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                color: 'text.primary',
                borderColor: 'rgba(0, 229, 255, 0.35)',
                backgroundColor: 'rgba(0, 229, 255, 0.1)'
              },
              '&:focus-visible': {
                outline: '2px solid var(--color-accent-cyan)',
                outlineOffset: '2px'
              },
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none'
              }
            }}
          >
            <Box component={item.Icon} sx={{ fontSize: 18, color: isActive ? 'primary.main' : 'text.secondary' }} />
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontSize: '0.7rem'
              }}
            >
              {item.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );

  const shortcuts = [
    { key: '1', description: 'Go to Tanks' },
    { key: '2', description: 'Go to Movements' },
    { key: '3', description: 'Go to Signals' },
    { key: '4', description: 'Go to COA' },
    { key: '5', description: 'Go to Adjustments' },
    { key: '6', description: 'Go to Import PDF' },
    { key: '?', description: 'Show this dialog' },
  ];

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: 7, md: 0 } }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Toolbar sx={{ minHeight: '72px !important', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em' }}>
                Tank Management
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {menuItems.find((item) => item.href === pathname)?.text || (pathname.startsWith('/tanks/') ? 'Tank Details' : 'Tanks')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {tabMenu}
              <Tooltip title="Keyboard Shortcuts">
                <IconButton
                  onClick={() => setShortcutsOpen(true)}
                  aria-label="Show keyboard shortcuts"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'var(--color-accent-cyan)',
                      bgcolor: 'rgba(0, 229, 255, 0.05)'
                    }
                  }}
                >
                  <KeyboardIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 3 },
            mt: '96px',
            minHeight: '100vh'
          }}
        >
          {children}
        </Box>
      </Box>

      <MobileNavigation />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={shortcuts}
      />
    </>
  );
}
