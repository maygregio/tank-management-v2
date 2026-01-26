'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import { terminalsApi } from '@/lib/api';
import { DynamicTankActivityChart } from '@/components/charts/DynamicCharts';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import type { TerminalSummary, TerminalDailyAggregation } from '@/lib/types';

function getDefaultDateRange() {
  const end = dayjs();
  const start = end.subtract(30, 'day');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
}

export default function TerminalsPage() {
  const defaultRange = getDefaultDateRange();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState(defaultRange);

  // Fetch terminal summaries
  const { data: terminals, isLoading: isLoadingTerminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: ({ signal }) => terminalsApi.getAll(signal),
  });

  // Fetch aggregated history when a location is selected
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['terminals', selectedLocation, 'history', dateRange.start, dateRange.end],
    queryFn: ({ signal }) =>
      terminalsApi.getAggregatedHistory(
        selectedLocation,
        dateRange.start,
        dateRange.end,
        signal
      ),
    enabled: !!selectedLocation && !!dateRange.start && !!dateRange.end,
  });

  // Auto-select first terminal when data loads
  const locations = useMemo(() => terminals?.map((t) => t.location) || [], [terminals]);
  if (!selectedLocation && locations.length > 0) {
    setSelectedLocation(locations[0]);
  }

  // Get selected terminal summary
  const selectedTerminal = useMemo(
    () => terminals?.find((t) => t.location === selectedLocation),
    [terminals, selectedLocation]
  );

  // Transform history data for chart
  const levelChartData = useMemo<Array<[number, number]>>(() => {
    if (!historyData) return [];
    return historyData.map((d) => [
      dayjs(d.date).valueOf(),
      d.total_level,
    ]);
  }, [historyData]);

  const movementChartData = useMemo<Array<[number, number]>>(() => {
    if (!historyData) return [];
    return historyData.map((d) => [
      dayjs(d.date).valueOf(),
      d.net_movement,
    ]);
  }, [historyData]);

  const handleResetDateRange = () => {
    setDateRange(getDefaultDateRange());
  };

  if (isLoadingTerminals) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
      </Box>
    );
  }

  if (!terminals || terminals.length === 0) {
    return (
      <EmptyState
        icon={<WarehouseIcon />}
        title="No Terminals Found"
        description="No tanks with locations exist in the system."
        action={{
          label: 'Go to Tanks',
          href: '/tanks',
        }}
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          p: 2,
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(12, 18, 29, 0.92)',
          boxShadow: '0 20px 50px rgba(5, 10, 18, 0.55)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <WarehouseIcon sx={{ fontSize: 28, color: 'var(--color-accent-cyan)' }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'var(--color-accent-cyan)',
              fontWeight: 800,
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
            }}
          >
            Terminal Aggregation
          </Typography>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: 'text.secondary' }}>
            View combined tank levels and movements by location
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          mb: 3,
          p: 2,
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(12, 18, 29, 0.88)',
        }}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="terminal-select-label">Terminal</InputLabel>
          <Select
            labelId="terminal-select-label"
            value={selectedLocation}
            label="Terminal"
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {locations.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="date"
          label="Start date"
          value={dateRange.start}
          onChange={(event) => {
            const newStart = event.target.value;
            setDateRange((prev) => ({
              start: newStart,
              end: prev.end && newStart > prev.end ? '' : prev.end,
            }));
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          type="date"
          label="End date"
          value={dateRange.end}
          onChange={(event) =>
            setDateRange((prev) => ({ ...prev, end: event.target.value }))
          }
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: dateRange.start || undefined },
          }}
          sx={{ minWidth: 160 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleResetDateRange}
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          Reset
        </Button>
      </Box>

      {/* Summary Cards */}
      {selectedTerminal && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              label="TANK COUNT"
              value={selectedTerminal.tank_count.toString()}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              label="TOTAL CAPACITY"
              value={`${selectedTerminal.total_capacity.toLocaleString()} bbl`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              label="CURRENT LEVEL"
              value={`${selectedTerminal.current_total_level.toLocaleString()} bbl`}
              accent
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              label="UTILIZATION"
              value={`${selectedTerminal.utilization_percentage.toFixed(1)}%`}
              accent
            />
          </Grid>
        </Grid>
      )}

      {/* Chart Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <SectionHeader title="Combined Level & Net Movement" />
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(12, 18, 29, 0.88)',
        }}
      >
        {isLoadingHistory ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <CircularProgress size={24} sx={{ color: 'var(--color-accent-cyan)' }} />
          </Box>
        ) : !historyData || historyData.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <Typography sx={{ color: 'text.secondary' }}>
              No movement data available for the selected date range.
            </Typography>
          </Box>
        ) : (
          <DynamicTankActivityChart
            levelData={levelChartData}
            movementData={movementChartData}
            height={350}
          />
        )}
      </Box>

      {/* Daily Breakdown */}
      {historyData && historyData.length > 0 && (
        <>
          <Box sx={{ mt: 4, mb: 2 }}>
            <SectionHeader title="Daily Movement Breakdown" />
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(12, 18, 29, 0.88)',
              overflowX: 'auto',
            }}
          >
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  padding: '8px 12px',
                  textAlign: 'right',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
                  fontSize: '0.8rem',
                },
                '& th': {
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                },
                '& td:first-of-type, & th:first-of-type': {
                  textAlign: 'left',
                },
              }}
            >
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Level (bbl)</th>
                  <th>Net Movement</th>
                  <th>Loads</th>
                  <th>Discharges</th>
                  <th>Transfers In</th>
                  <th>Transfers Out</th>
                  <th>Adjustments</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {historyData.slice(-10).reverse().map((row) => (
                  <tr key={row.date}>
                    <td>{dayjs(row.date).format('M/D/YYYY')}</td>
                    <td style={{ color: 'var(--color-accent-cyan)', fontWeight: 600 }}>
                      {row.total_level.toLocaleString()}
                    </td>
                    <td
                      style={{
                        color:
                          row.net_movement > 0
                            ? '#00e676'
                            : row.net_movement < 0
                            ? '#ff5252'
                            : 'inherit',
                        fontWeight: 600,
                      }}
                    >
                      {row.net_movement > 0 ? '+' : ''}
                      {row.net_movement.toLocaleString()}
                    </td>
                    <td style={{ color: '#00e676' }}>
                      {row.loads_volume > 0 ? `+${row.loads_volume.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: '#ff5252' }}>
                      {row.discharges_volume > 0
                        ? `-${row.discharges_volume.toLocaleString()}`
                        : '—'}
                    </td>
                    <td style={{ color: '#00e676' }}>
                      {row.transfers_in_volume > 0
                        ? `+${row.transfers_in_volume.toLocaleString()}`
                        : '—'}
                    </td>
                    <td style={{ color: '#ff5252' }}>
                      {row.transfers_out_volume > 0
                        ? `-${row.transfers_out_volume.toLocaleString()}`
                        : '—'}
                    </td>
                    <td
                      style={{
                        color:
                          row.adjustments_volume > 0
                            ? '#00e676'
                            : row.adjustments_volume < 0
                            ? '#ff5252'
                            : 'inherit',
                      }}
                    >
                      {row.adjustments_volume !== 0
                        ? `${row.adjustments_volume > 0 ? '+' : ''}${row.adjustments_volume.toLocaleString()}`
                        : '—'}
                    </td>
                    <td>{row.utilization_percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </Box>
            {historyData.length > 10 && (
              <Typography
                sx={{
                  mt: 1,
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                }}
              >
                Showing last 10 days of {historyData.length} total
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'rgba(12, 18, 29, 0.88)',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          letterSpacing: '0.12em',
          fontSize: '0.6rem',
          display: 'block',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          color: accent ? 'var(--color-accent-cyan)' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
