import { tankCreateSchema, type TankCreateInput } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import { tanksApi } from '@/lib/api';
import TankCard from '@/components/TankCard';
import EmptyState from '@/components/EmptyState';
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
import AddIcon from '@mui/icons-material/Add';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';

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
      success('Storage unit deployed successfully');
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleCloseDialog();
    },
    onError: () => {
      showError('Failed to deploy storage unit');
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
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    try {
      tankCreateSchema.parse({
        ...formData,
        initial_level: formData.initial_level ?? undefined
      });
      setErrors({});
      return true;
    } catch {
      setErrors({});
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createMutation.mutate({
      ...formData,
      initial_level: formData.initial_level || 0,
    });
  };

  const handleChange = (field: keyof TankCreateInput, value: string | number) => {
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
                background: 'linear-gradient(160deg, rgba(18, 26, 39, 0.92) 0%, rgba(10, 15, 26, 0.88) 100%)',
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
            aria-label="Deploy new storage unit"
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

      {!tanks || tanks.length === 0 ? (
        <EmptyState
          icon={<PropaneTankIcon />}
          title="No Storage Units Deployed"
          description="Deploy your first storage unit to begin monitoring fuel levels."
          action={{
            label: 'Deploy Unit',
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
            <InputLabel>Fuel Classification</InputLabel>
            <Select
              value={formData.fuel_type}
              label="Fuel Classification"
              onChange={(e) => handleChange('fuel_type', e.target.value)}
              aria-label="Fuel type"
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
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--color-border)', p: 2 }}>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}
