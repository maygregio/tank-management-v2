'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', href: '/', Icon: DashboardIcon },
  { text: 'Tanks', href: '/tanks', Icon: PropaneTankIcon },
  { text: 'Movements', href: '/movements', Icon: SwapHorizIcon },
  { text: 'Adjustments', href: '/adjustments', Icon: TuneIcon },
  { text: 'Import PDF', href: '/imports', Icon: UploadFileIcon },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        px: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -1,
          left: 0,
          width: '40px',
          height: '2px',
          bgcolor: 'primary.main',
          boxShadow: '0 0 8px var(--color-accent-cyan)'
        }
      }}>
        <Typography variant="overline" sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 6, height: 6, bgcolor: 'primary.main', borderRadius: '50%', boxShadow: '0 0 8px var(--color-accent-cyan)' }} />
          MISSION COMMAND
        </Typography>
      </Box>
      <List sx={{
        px: 1.5,
        py: 2,
        flexGrow: 1,
        backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.07) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        backgroundPosition: '-1px -1px'
      }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: '10px',
                  minHeight: 40,
                  transition: 'transform 0.3s ease, background 0.3s ease',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0, 229, 255, 0.12)',
                    backgroundImage: 'linear-gradient(90deg, rgba(0, 229, 255, 0.18), rgba(139, 92, 246, 0.16))',
                    '& .MuiListItemIcon-root': { color: 'primary.main', filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.6))' },
                    '& .MuiListItemText-primary': { color: 'text.primary', fontWeight: 600 },
                    '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.18)' }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    transform: 'translateX(2px)',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '&:hover': { transform: 'none' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, transition: 'color 0.2s', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                  <item.Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: { sx: { fontSize: '0.8125rem', letterSpacing: '0.01em', textTransform: 'uppercase' } } }}
                />
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  boxShadow: isActive ? '0 0 10px rgba(0, 229, 255, 0.8)' : 'none',
                  transition: 'all 0.3s ease'
                }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.65rem', fontWeight: 600 }}>
          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4caf50', display: 'inline-block' }} />
          SYSTEMS ONLINE
        </Typography>
      </Box>
    </Box>
  ), [pathname]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em' }}>
            {menuItems.find((item) => item.href === pathname)?.text || 'Tank Management'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
