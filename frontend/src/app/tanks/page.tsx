'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import { tanksApi } from '@/lib/api';
import TankCard from '@/components/TankCard';
import type { TankCreate, FuelType } from '@/lib/types';

export default function TanksPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [formData, setFormData] = useState<TankCreate>({
    name: '',
    location: '',
    fuel_type: 'diesel',
    capacity: 0,
    initial_level: undefined,
  });

  // Fetch all tanks once, filter client-side
  const { data: allTanks, isLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  // Filter tanks client-side and extract unique locations
  const tanks = filterLocation
    ? allTanks?.filter((t) => t.location === filterLocation)
    : allTanks;
  const uniqueLocations = [...new Set(allTanks?.map((t) => t.location) || [])].sort();

  const createMutation = useMutation({
    mutationFn: tanksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      location: '',
      fuel_type: 'diesel',
      capacity: 0,
      initial_level: undefined,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.location.trim() || formData.capacity <= 0) return;
    createMutation.mutate({
      ...formData,
      initial_level: formData.initial_level || 0,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tactical Command Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            STORAGE UNITS
          </Typography>
          <Box sx={{ width: 60, height: '1px', background: 'linear-gradient(90deg, var(--color-accent-cyan) 0%, transparent 100%)' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {uniqueLocations.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Location Filter</InputLabel>
              <Select
                value={filterLocation}
                label="Location Filter"
                onChange={(e) => setFilterLocation(e.target.value)}
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="">All Locations</MenuItem>
                {uniqueLocations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              bgcolor: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid var(--color-accent-cyan)',
              '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            }}
          >
            Deploy Unit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {tanks?.map((tank) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={tank.id}>
            <TankCard tank={tank} />
          </Grid>
        ))}
      </Grid>

      {tanks?.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 6, p: 4, border: '1px solid var(--color-border)', bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 1 }}>
            NO STORAGE UNITS DEPLOYED
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Use &quot;Deploy Unit&quot; to register your first tank and begin monitoring levels.
          </Typography>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backgroundImage: 'linear-gradient(135deg, rgba(18, 26, 39, 0.92), rgba(10, 14, 23, 0.9))',
              boxShadow: '0 24px 60px rgba(5, 10, 18, 0.6)',
              backdropFilter: 'blur(18px)',
            },
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid var(--color-border)', pb: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em' }}>
            DEPLOY STORAGE UNIT
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Unit Designation"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Main Depot, Warehouse A"
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Fuel Classification</InputLabel>
            <Select
              value={formData.fuel_type}
              label="Fuel Classification"
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as FuelType })}
            >
              <MenuItem value="diesel">Diesel</MenuItem>
              <MenuItem value="gasoline">Gasoline</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Maximum Capacity (bbl)"
            type="number"
            fullWidth
            required
            value={formData.capacity || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, capacity: value === '' ? 0 : Number(value) });
            }}
          />
          <TextField
            margin="dense"
            label="Initial Fill Level (bbl)"
            type="number"
            fullWidth
            value={formData.initial_level ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, initial_level: value === '' ? undefined : Number(value) });
            }}
          />

        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>Abort</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim() || !formData.location.trim() || formData.capacity <= 0}
            sx={{
              bgcolor: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid var(--color-accent-cyan)',
              '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
