'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DialogScaffold from '@/components/DialogScaffold';
import { coaApi } from '@/lib/api';
import type { COAWithSignal } from '@/lib/types';
import { formatDate } from '@/lib/dateUtils';
import { openPdfInNewTab } from '@/lib/constants';

interface COAPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  coa: COAWithSignal | null;
}

interface PropertyRowProps {
  label: string;
  value: string | number | undefined | null;
  unit?: string;
  highlight?: boolean;
}

function PropertyRow({ label, value, unit, highlight }: PropertyRowProps) {
  const hasValue = value !== null && value !== undefined;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: 1.5,
        borderRadius: '6px',
        bgcolor: highlight ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
        '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.03)' },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: hasValue ? 600 : 400,
          color: hasValue ? 'text.primary' : 'text.disabled',
          fontFamily: hasValue ? 'monospace' : 'inherit',
        }}
      >
        {hasValue ? `${value}${unit ? ` ${unit}` : ''}` : '—'}
      </Typography>
    </Box>
  );
}

export default function COAPropertiesDialog({ open, onClose, coa }: COAPropertiesDialogProps) {
  if (!coa) return null;

  return (
    <DialogScaffold
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      actions={(
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Close
        </Button>
      )}
      title={(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'var(--color-accent-cyan)', fontWeight: 700, letterSpacing: '0.15em' }}
            >
              Certificate of Analysis
            </Typography>
            {coa.nomination_key && (
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mt: 0.5 }}>
                {coa.nomination_key}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => openPdfInNewTab(coa.pdf_url, coaApi.getPdfUrl)}
            sx={{ color: 'var(--color-accent-cyan)' }}
            title="View PDF"
          >
            <PictureAsPdfIcon />
            <OpenInNewIcon sx={{ fontSize: 12, ml: 0.5 }} />
          </IconButton>
        </Box>
      )}
    >
      {/* Metadata Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.15em', mb: 1.5, display: 'block' }}
        >
          Document Information
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              ANALYSIS DATE
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {coa.analysis_date ? formatDate(coa.analysis_date) : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              EQUIPMENT
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {coa.refinery_equipment || '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              LABORATORY
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {coa.lab_name || '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              LINKED SIGNAL
            </Typography>
            {coa.signal ? (
              <Chip
                label={coa.signal.signal_id || 'Signal'}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 230, 118, 0.15)',
                  color: '#00e676',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            ) : (
              <Chip
                label="Unlinked"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 179, 0, 0.15)',
                  color: '#ffb300',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Chemical Properties Section */}
      <Box>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.15em', mb: 1.5, display: 'block' }}
        >
          Chemical Properties
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 1,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
        >
          <PropertyRow label="BMCI" value={coa.bmci} highlight />
          <PropertyRow label="API Gravity" value={coa.api_gravity} unit="°" />
          <PropertyRow label="Specific Gravity (@ 15.56°C)" value={coa.specific_gravity} />
          <PropertyRow
            label={`Viscosity${coa.viscosity_temp ? ` @ ${coa.viscosity_temp}` : ''}`}
            value={coa.viscosity}
            unit="SUS"
          />
          <PropertyRow label="Sulfur Content" value={coa.sulfur_content} unit="wt%" highlight />
          <PropertyRow label="Flash Point (PMCC)" value={coa.flash_point} unit="°C" />
          <PropertyRow label="Ash Content" value={coa.ash_content} unit="wt%" />
          <PropertyRow label="Moisture Content" value={coa.moisture_content} unit="wt%" />
          <PropertyRow label="Toluene Insoluble" value={coa.toluene_insoluble} unit="wt%" />
          <PropertyRow label="Sodium Content" value={coa.sodium_content} unit="ppm" />
        </Box>
      </Box>

      {/* Extraction Info */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid var(--color-border)' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
          Extracted on {formatDate(coa.extraction_date)} via AI analysis
        </Typography>
      </Box>
    </DialogScaffold>
  );
}
