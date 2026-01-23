'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import CellTowerIcon from '@mui/icons-material/CellTower';
import ScienceIcon from '@mui/icons-material/Science';
import GridViewIcon from '@mui/icons-material/GridView';

const menuItems = [
  { text: 'Tanks', href: '/tanks', Icon: PropaneTankIcon },
  { text: 'Movements', href: '/movements', Icon: SwapHorizIcon },
  { text: 'Overview', href: '/overview', Icon: GridViewIcon },
  { text: 'Signals', href: '/signals', Icon: CellTowerIcon },
  { text: 'COA', href: '/coa', Icon: ScienceIcon },
  { text: 'Adjustments', href: '/adjustments', Icon: TuneIcon },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
            {tabMenu}
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
    </>
  );
}
