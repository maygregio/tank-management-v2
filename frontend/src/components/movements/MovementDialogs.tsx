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
            <Typography sx={{ color: 'var(--color-accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{(movement.expected_volume || 0).toLocaleString()} bbl</Typography>
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
            value={editData.scheduled_date_manual || ''}
            onChange={(e) => onEditDataChange({ ...editData, scheduled_date_manual: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Expected Volume (bbl)"
            type="number"
            value={editData.expected_volume_manual || ''}
            onChange={(e) => {
              const value = e.target.value;
              onEditDataChange({ ...editData, expected_volume_manual: value === '' ? undefined : Number(value) });
            }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={2}
            value={editData.notes_manual || ''}
            onChange={(e) => onEditDataChange({ ...editData, notes_manual: e.target.value })}
          />

          {/* Additional workflow fields */}
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.1em', fontSize: '0.6rem' }}>
              ADDITIONAL INFO (OPTIONAL)
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Strategy ID"
              type="number"
              value={editData.strategy_manual ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                onEditDataChange({ ...editData, strategy_manual: value === '' ? undefined : Number(value) });
              }}
              slotProps={{ htmlInput: { min: 0 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Destination"
              value={editData.destination_manual || ''}
              onChange={(e) => onEditDataChange({ ...editData, destination_manual: e.target.value })}
              placeholder="e.g., IMTT"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Equipment"
              value={editData.equipment_manual || ''}
              onChange={(e) => onEditDataChange({ ...editData, equipment_manual: e.target.value })}
              placeholder="e.g., WEB 241/248"
            />

            <TextField
              fullWidth
              margin="normal"
              label="Discharge Date"
              type="date"
              value={editData.discharge_date_manual || ''}
              onChange={(e) => onEditDataChange({ ...editData, discharge_date_manual: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <TextField
            fullWidth
            margin="normal"
            label="Base Diff ($/bbl)"
            type="number"
            value={editData.base_diff_manual ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              onEditDataChange({ ...editData, base_diff_manual: value === '' ? undefined : Number(value) });
            }}
            slotProps={{ htmlInput: { step: 0.01 } }}
          />
        </Box>
      )}
    </GlassDialog>
  );
}
