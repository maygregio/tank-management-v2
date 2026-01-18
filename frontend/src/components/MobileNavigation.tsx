'use client';

import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CellTowerIcon from '@mui/icons-material/CellTower';
import ScienceIcon from '@mui/icons-material/Science';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const menuItems = [
  { text: 'Dashboard', href: '/', Icon: DashboardIcon },
  { text: 'Tanks', href: '/tanks', Icon: PropaneTankIcon },
  { text: 'Movements', href: '/movements', Icon: SwapHorizIcon },
  { text: 'Signals', href: '/signals', Icon: CellTowerIcon },
  { text: 'COA', href: '/coa', Icon: ScienceIcon },
  { text: 'Adjustments', href: '/adjustments', Icon: TuneIcon },
  { text: 'Import', href: '/imports', Icon: UploadFileIcon },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  if (!isMobile) return null;

  const currentValue = menuItems.findIndex(item => item.href === pathname);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        display: { xs: 'block', md: 'none' }
      }}
    >
      <Paper
        elevation={3}
        sx={{
          bgcolor: 'rgba(10, 12, 16, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0, 229, 255, 0.2)'
        }}
      >
        <BottomNavigation
          value={currentValue >= 0 ? currentValue : 0}
          onChange={(_, newValue) => {
            window.location.href = menuItems[newValue].href;
          }}
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              minWidth: 'auto',
              padding: '8px 12px',
              '&.Mui-selected': {
                color: 'var(--color-accent-cyan)',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }
              },
              '& .MuiSvgIcon-root': {
                fontSize: 20
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
              '&.Mui-selected': {
                fontWeight: 600
              }
            }
          }}
        >
          {menuItems.map((item) => (
            <BottomNavigationAction
              key={item.text}
              label={item.text}
              icon={<item.Icon />}
              aria-label={item.text}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
