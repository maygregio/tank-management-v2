import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GlassDialog from '@/components/GlassDialog';
import type { Movement, MovementUpdate, TankWithLevel } from '@/lib/types';

interface CompleteDialogProps {
  open: boolean;
  onClose: () => void;
  movement: Movement | null;
  tankMap: Map<string, TankWithLevel>;
  actualVolume: number;
  onActualVolumeChange: (value: number) => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function CompleteDialog({
  open,
  onClose,
  movement,
  tankMap,
  actualVolume,
  onActualVolumeChange,
  onComplete,
  isSubmitting,
}: CompleteDialogProps) {
  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      title="CONFIRM OPERATION"
      actions={
        <>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Abort</Button>
          <Button
            onClick={onComplete}
            variant="contained"
            disabled={actualVolume <= 0 || isSubmitting}
            sx={{
              bgcolor: 'rgba(0, 230, 118, 0.1)',
              color: '#00e676',
              border: '1px solid #00e676',
              '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.2)' },
              '&:disabled': { opacity: 0.3 }
            }}
          >
            {isSubmitting ? 'Processing…' : 'Confirm'}
          </Button>
        </>
      }
    >
      {movement && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>TARGET TANK</Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>{movement.tank_id ? tankMap.get(movement.tank_id)?.name : 'Unassigned'}</Typography>
          </Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>EXPECTED VOLUME</Typography>
            <Typography sx={{ color: 'var(--color-accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{movement.expected_volume.toLocaleString()} bbl</Typography>
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label="Actual Volume (bbl)"
            type="number"
            required
            value={actualVolume || ''}
            onChange={(e) => {
              const value = e.target.value;
              onActualVolumeChange(value === '' ? 0 : Number(value));
            }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            autoFocus
          />
        </Box>
      )}
    </GlassDialog>
  );
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  movement: Movement | null;
  tankMap: Map<string, TankWithLevel>;
  editData: MovementUpdate;
  onEditDataChange: (data: MovementUpdate) => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

export function EditDialog({
  open,
  onClose,
  movement,
  tankMap,
  editData,
  onEditDataChange,
  onEdit,
  isSubmitting,
}: EditDialogProps) {
  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      title="EDIT OPERATION"
      titleColor="#ffab00"
      actions={
        <>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={onEdit}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              bgcolor: 'rgba(255, 171, 0, 0.1)',
              color: '#ffab00',
              border: '1px solid #ffab00',
              '&:hover': { bgcolor: 'rgba(255, 171, 0, 0.2)' },
              '&:disabled': { opacity: 0.3 },
            }}
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {movement && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
              TARGET TANK
            </Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>
              {movement.tank_id ? tankMap.get(movement.tank_id)?.name : 'Unassigned'}
            </Typography>
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label="Scheduled Date"
            type="date"
            value={editData.scheduled_date || ''}
            onChange={(e) => onEditDataChange({ ...editData, scheduled_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Expected Volume (bbl)"
            type="number"
            value={editData.expected_volume || ''}
            onChange={(e) => {
              const value = e.target.value;
              onEditDataChange({ ...editData, expected_volume: value === '' ? undefined : Number(value) });
            }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={2}
            value={editData.notes || ''}
            onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
          />
        </Box>
      )}
    </GlassDialog>
  );
}
