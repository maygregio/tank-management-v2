import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { styles } from '@/lib/constants';
import type { MovementCreate, MovementType, TransferTargetCreate, TankWithLevel } from '@/lib/types';

interface ManualEntryFormProps {
  formData: MovementCreate;
  onFormDataChange: (data: MovementCreate) => void;
  transferTargets: TransferTargetCreate[];
  onTransferTargetsChange: (targets: TransferTargetCreate[]) => void;
  tanks: TankWithLevel[];
  targetTanks: TankWithLevel[];
  availableTargetTanks: TankWithLevel[];
  totalTransferVolume: number;
  remainingTransferVolume: number;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ManualEntryForm({
  formData,
  onFormDataChange,
  transferTargets,
  onTransferTargetsChange,
  tanks,
  targetTanks,
  availableTargetTanks,
  totalTransferVolume,
  remainingTransferVolume,
  onSubmit,
  isSubmitting,
}: ManualEntryFormProps) {
  const hasTransferTargets = transferTargets.length > 0;

  return (
    <Card sx={{
      background: styles.cardGradient,
      borderLeft: '2px solid var(--color-accent-cyan)',
      boxShadow: '0 22px 60px rgba(5, 10, 18, 0.6)',
    }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Schedule Operation
        </Typography>
        <ToggleButtonGroup
          value={formData.type}
          exclusive
          fullWidth
          onChange={(_, value) => {
            if (!value) return;
            onFormDataChange({
              ...formData,
              type: value as MovementType,
              target_tank_id: '',
            });
            onTransferTargetsChange([]);
          }}
          sx={{ mb: 2, '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'var(--color-border)' }, '& .Mui-selected': { color: 'var(--color-accent-cyan)', borderColor: 'var(--color-accent-cyan)' } }}
        >
          <ToggleButton value="load">Load</ToggleButton>
          <ToggleButton value="discharge">Discharge</ToggleButton>
          <ToggleButton value="transfer">Transfer</ToggleButton>
          <ToggleButton value="adjustment">Adjustment</ToggleButton>
        </ToggleButtonGroup>
        <form onSubmit={onSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>
              {formData.type === 'load' ? 'Target Tank' : 'Source Tank'}
            </InputLabel>
            <Select
              value={formData.tank_id}
              label={formData.type === 'load' ? 'Target Tank' : 'Source Tank'}
              onChange={(e) => onFormDataChange({ ...formData, tank_id: e.target.value })}
            >
              {tanks?.map((tank) => (
                <MenuItem key={tank.id} value={tank.id}>
                  {tank.name} ({tank.current_level.toLocaleString()} bbl / {tank.capacity.toLocaleString()} bbl)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {formData.type === 'transfer' && formData.tank_id && (
            <Typography variant="caption" sx={{ color: remainingTransferVolume < 0 ? '#ff6b6b' : 'text.secondary' }}>
              Remaining after transfer: {remainingTransferVolume.toLocaleString()} bbl
            </Typography>
          )}

          {formData.type === 'transfer' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
                DESTINATION TANKS
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5, mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  Total volume: {totalTransferVolume.toLocaleString()} bbl
                </Typography>
                <Typography variant="caption" sx={{ color: remainingTransferVolume < 0 ? 'error.main' : 'text.secondary', fontSize: '0.65rem' }}>
                  Remaining: {remainingTransferVolume.toLocaleString()} bbl
                </Typography>
                {transferTargets.map((target, index) => {
                  const targetTank = tanks?.find((tank) => tank.id === target.tank_id);
                  return (
                    <Box key={`${target.tank_id}-${index}`} sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' }, alignItems: 'center' }}>
                      <FormControl size="small" fullWidth required>
                        <InputLabel>Target Tank</InputLabel>
                        <Select
                          value={target.tank_id}
                          label="Target Tank"
                          onChange={(e) => {
                            const nextTargets = [...transferTargets];
                            nextTargets[index] = { ...target, tank_id: e.target.value };
                            onTransferTargetsChange(nextTargets);
                          }}
                        >
                          {targetTanks.map((tank) => (
                            <MenuItem key={tank.id} value={tank.id}>
                              {tank.name} ({tank.current_level.toLocaleString()} bbl / {tank.capacity.toLocaleString()} bbl)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                        <TextField
                          size="small"
                          label="Volume (bbl)"
                          type="number"
                          value={target.volume || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const nextTargets = [...transferTargets];
                            nextTargets[index] = { ...target, volume: value === '' ? 0 : Number(value) };
                            onTransferTargetsChange(nextTargets);
                          }}
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        />

                      <Button
                        variant="text"
                        sx={{ color: 'text.secondary' }}
                        onClick={() => {
                          const nextTargets = transferTargets.filter((_, idx) => idx !== index);
                          onTransferTargetsChange(nextTargets);
                        }}
                      >
                        Remove
                      </Button>
                      {targetTank && (
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', gridColumn: { xs: '1', sm: '1 / span 3' } }}>
                          {targetTank.name} available: {targetTank.current_level.toLocaleString()} bbl
                        </Typography>
                      )}
                    </Box>
                  );
                })}
                <Button
                  variant="outlined"
                  size="small"
                  disabled={availableTargetTanks.length === 0}
                  onClick={() => onTransferTargetsChange([
                    ...transferTargets,
                    { tank_id: availableTargetTanks[0]?.id || '', volume: 0 }
                  ])}
                  sx={{
                    alignSelf: 'flex-start',
                    borderColor: 'var(--color-accent-cyan)',
                    color: 'var(--color-accent-cyan)',
                  }}
                >
                  Add Target
                </Button>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Scheduled Date"
            type="date"
            required
            value={formData.scheduled_date}
            onChange={(e) => onFormDataChange({ ...formData, scheduled_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {formData.type !== 'transfer' && (
          <TextField
            fullWidth
            margin="normal"
            label="Expected Volume (bbl)"
            type="number"
            required
            value={formData.expected_volume || ''}
            onChange={(e) => {
              const value = e.target.value;
              onFormDataChange({ ...formData, expected_volume: value === '' ? 0 : Number(value) });
            }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />

          )}

          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid var(--color-accent-cyan)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
            disabled={!formData.tank_id || isSubmitting || (formData.type !== 'transfer' && formData.expected_volume <= 0) || (formData.type === 'transfer' && !hasTransferTargets)}
          >
            {isSubmitting ? 'Initializing…' : 'Execute Operation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
