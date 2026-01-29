'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import DialogScaffold from '@/components/DialogScaffold';
import type { COAWithSignal, Movement } from '@/lib/types';

interface COALinkDialogProps {
  open: boolean;
  onClose: () => void;
  onLink: (coaId: string, signalId: string) => Promise<void>;
  coa: COAWithSignal | null;
  signals: Movement[];
  isLinking: boolean;
}

export default function COALinkDialog({
  open,
  onClose,
  onLink,
  coa,
  signals,
  isLinking,
}: COALinkDialogProps) {
  const [selectedSignalId, setSelectedSignalId] = useState<string>('');

  const handleLink = async () => {
    if (!coa || !selectedSignalId) return;
    await onLink(coa.id, selectedSignalId);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSignalId('');
    onClose();
  };

  if (!coa) return null;

  // Filter signals that have trade info
  const signalsWithTrade = signals.filter(s => s.trade_number && s.trade_line_item);

  return (
    <DialogScaffold
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      title="Link COA to Signal"
      titleColor="#8b5cf6"
      actions={(
        <>
          <Button onClick={handleClose} sx={{ color: 'text.secondary' }} disabled={isLinking}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            variant="contained"
            disabled={!selectedSignalId || isLinking}
            startIcon={isLinking ? <CircularProgress size={16} /> : undefined}
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              border: '1px solid #8b5cf6',
              '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)' },
              '&:disabled': { opacity: 0.3 },
            }}
          >
            {isLinking ? 'Linking...' : 'Link'}
          </Button>
        </>
      )}
    >
        {/* COA Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                NOMINATION KEY
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent-cyan)' }}>
                {coa.nomination_key || 'Not extracted'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                CURRENT STATUS
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: coa.signal_id ? '#00e676' : '#ffb300' }}>
                {coa.signal_id ? 'Linked' : 'Unlinked'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Signal Selection */}
        <FormControl fullWidth>
          <InputLabel>Select Signal</InputLabel>
          <Select
            value={selectedSignalId}
            label="Select Signal"
            onChange={(e) => setSelectedSignalId(e.target.value)}
          >
            {signalsWithTrade.length === 0 ? (
              <MenuItem value="" disabled>
                No signals with trade info available
              </MenuItem>
            ) : (
              signalsWithTrade.map((signal) => (
                <MenuItem key={signal.id} value={signal.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 600 }}>{signal.signal_id}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Trade: {signal.trade_number}/{signal.trade_line_item}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2 }}>
          This will link the COA to the selected signal. If the signal already has a COA, it will be replaced.
        </Typography>
    </DialogScaffold>
  );
}
