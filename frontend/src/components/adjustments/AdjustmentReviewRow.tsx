'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styles } from '@/lib/constants';
import type { AdjustmentReadingWithMatches, TankWithLevel } from '@/lib/types';

interface SelectedAdjustment {
  fileIndex: number;
  readingIndex: number;
  tankId: string;
  physicalLevel: number;
  inspectionDate: string;
  notes?: string;
  pdfUrl?: string;
}

interface AdjustmentReviewRowProps {
  reading: AdjustmentReadingWithMatches;
  readingIndex: number;
  fileIndex: number;
  filename: string;
  pdfUrl?: string;
  isSelected: boolean;
  selection?: SelectedAdjustment;
  tankOptions: TankWithLevel[];
  onToggle: (
    fileIndex: number,
    readingIndex: number,
    reading: AdjustmentReadingWithMatches,
    filename: string,
    pdfUrl?: string
  ) => void;
  onChangeTank: (key: string, tankId: string, filename: string, pdfUrl?: string) => void;
}

export default function AdjustmentReviewRow({
  reading,
  readingIndex,
  fileIndex,
  filename,
  pdfUrl,
  isSelected,
  selection,
  tankOptions,
  onToggle,
  onChangeTank,
}: AdjustmentReviewRowProps) {
  const key = `${fileIndex}-${readingIndex}`;

  const suggestedMatchIds = useMemo(
    () => new Set(reading.suggested_matches.map((match) => match.tank_id)),
    [reading.suggested_matches]
  );

  const extraTankOptions = useMemo(
    () => tankOptions.filter((tank) => !suggestedMatchIds.has(tank.id)),
    [tankOptions, suggestedMatchIds]
  );

  const delta = reading.delta;
  const isPositive = delta !== null && delta >= 0;

  const handleCheckboxChange = () => {
    onToggle(fileIndex, readingIndex, reading, filename, pdfUrl);
  };

  const handleSelectChange = (tankId: string) => {
    if (!isSelected && reading.best_match) {
      onToggle(fileIndex, readingIndex, reading, filename, pdfUrl);
    }
    onChangeTank(key, tankId, filename, pdfUrl);
  };

  return (
    <TableRow
      sx={{
        opacity: isSelected ? 1 : 0.6,
        '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.06)' },
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          disabled={reading.suggested_matches.length === 0}
          sx={{
            color: 'var(--color-border)',
            '&.Mui-checked': { color: '#ffab00' },
          }}
        />
      </TableCell>

      <TableCell>
        <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
          {reading.extracted.tank_name}
        </Typography>
      </TableCell>

      <TableCell>
        {reading.suggested_matches.length > 0 ? (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selection?.tankId || reading.best_match?.tank_id || ''}
              onChange={(e) => handleSelectChange(e.target.value)}
              sx={{ fontSize: '0.8rem' }}
            >
              {reading.suggested_matches.map((match) => (
                <MenuItem key={match.tank_id} value={match.tank_id}>
                  {match.tank_name} ({match.confidence}%)
                </MenuItem>
              ))}
              {extraTankOptions.map((tank) => (
                <MenuItem key={tank.id} value={tank.id}>
                  {tank.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: 'error.main' }}>
            No match found
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont }}>
          {reading.extracted.physical_level.toLocaleString()} bbl
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography sx={{ fontSize: '0.8rem', fontFamily: styles.monoFont, color: 'text.secondary' }}>
          {reading.system_level !== null ? `${reading.system_level.toLocaleString()} bbl` : '—'}
        </Typography>
      </TableCell>

      <TableCell align="right">
        {delta !== null ? (
          <Chip
            label={`${isPositive ? '+' : ''}${delta.toLocaleString()} bbl`}
            size="small"
            sx={{
              bgcolor: isPositive ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
              color: isPositive ? '#00e676' : '#ff5252',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          />
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>
        )}
      </TableCell>

      <TableCell>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {reading.extracted.inspection_date || '—'}
        </Typography>
      </TableCell>

      <TableCell>
        {reading.best_match && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {reading.is_exact_match ? (
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <ErrorOutlineIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: reading.is_exact_match ? 'success.main' : 'warning.main',
              }}
            >
              {reading.best_match.confidence}%
            </Typography>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}
