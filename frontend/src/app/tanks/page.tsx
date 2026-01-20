'use client';

import { tankCreateSchema, type TankCreateInput } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import { tanksApi } from '@/lib/api';
import TankCard from '@/components/TankCard';
import EmptyState from '@/components/EmptyState';
import GlassDialog from '@/components/GlassDialog';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';

export default function TanksPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [formData, setFormData] = useState<TankCreateInput>({
    name: '',
    location: '',
    feedstock_type: 'carbon_black_oil',
    capacity: 0,
    initial_level: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success, error: showError } = useToast();

  const { data: allTanks, isLoading } = useQuery({
    queryKey: ['tanks'],
    queryFn: () => tanksApi.getAll(),
  });

  const tanks = filterLocation
    ? allTanks?.filter((t) => t.location === filterLocation)
    : allTanks;
  const uniqueLocations = [...new Set(allTanks?.map((t) => t.location) || [])].sort();

  const createMutation = useMutation({
    mutationFn: (data: TankCreateInput) => tanksApi.create(data),
    onSuccess: () => {
      success('Tank added successfully');
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleCloseDialog();
    },
    onError: () => {
      showError('Failed to deploy tank');
    },
  });

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      location: '',
      feedstock_type: 'carbon_black_oil',
      capacity: 0,
      initial_level: undefined,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const result = tankCreateSchema.safeParse({
      ...formData,
      initial_level: formData.initial_level ?? undefined
    });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createMutation.mutate({
      ...formData,
      initial_level: formData.initial_level || 0,
    });
  };

  const handleChange = (field: keyof TankCreateInput, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
            <Box
              sx={{
                height: 220,
                borderRadius: '12px',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                backgroundColor: 'rgba(14, 21, 33, 0.92)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            TANKS
          </Typography>
          <Box sx={{ width: 60, height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.35)' }} />
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
                aria-label="Filter by location"
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
            aria-label="Add new tank"
            sx={{
              bgcolor: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid var(--color-accent-cyan)',
              '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
            }}
          >
            Add Tank
          </Button>
        </Box>
      </Box>

      {!tanks || tanks.length === 0 ? (
        <EmptyState
          icon={<PropaneTankIcon />}
          title="No Tanks Added Yet"
          description="Add your first tank to begin monitoring feedstock levels."
          action={{
            label: 'Add Tank',
            onClick: handleOpenDialog
          }}
        />
      ) : (
        <Grid container spacing={2}>
          {tanks.map((tank) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={tank.id}>
              <TankCard tank={tank} />
            </Grid>
          ))}
        </Grid>
      )}

      <GlassDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        title="ADD TANK"
        actions={
          <>
            <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>Abort</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name.trim() || !formData.location.trim() || formData.capacity <= 0 || createMutation.isPending}
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
          </>
        }
      >
        <TextField
          autoFocus
          margin="dense"
          label="Tank Designation"
          fullWidth
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          aria-label="Tank name"
        />
        <TextField
          margin="dense"
          label="Location"
          fullWidth
          required
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          error={!!errors.location}
          helperText={errors.location}
          placeholder="e.g., Main Depot, Warehouse A"
          aria-label="Tank location"
        />
        <FormControl fullWidth margin="dense" required>
          <InputLabel>Feedstock Classification</InputLabel>
          <Select
            value={formData.feedstock_type}
            label="Feedstock Classification"
            onChange={(e) => handleChange('feedstock_type', e.target.value)}
            aria-label="Feedstock type"
          >
            <MenuItem value="carbon_black_oil">Carbon Black Oil</MenuItem>
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
          onChange={(e) => handleChange('capacity', e.target.value === '' ? 0 : Number(e.target.value))}
          error={!!errors.capacity}
          helperText={errors.capacity}
          aria-label="Tank capacity"
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          margin="dense"
          label="Initial Fill Level (bbl)"
          type="number"
          fullWidth
          value={formData.initial_level ?? ''}
          onChange={(e) => handleChange('initial_level', e.target.value === '' ? undefined : Number(e.target.value))}
          error={!!errors.initial_level}
          helperText={errors.initial_level}
          aria-label="Initial fill level"
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
      </GlassDialog>
    </Box>
  );
}
