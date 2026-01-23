import type { GridColumnVisibilityModel } from '@mui/x-data-grid';

export type ProfileName = 'All' | 'Scheduler' | 'Trader' | 'Quality' | 'Custom';

// Column fields used in the overview grid
const ALL_COLUMNS = [
  'signal_id', 'notes', 'nomination_key', 'refinery_tank_name', 'expected_volume',
  'scheduled_date', 'coa_api_gravity', 'coa_sulfur_content', 'coa_viscosity',
  'coa_ash_content', 'base_diff', 'quality_adj_diff', 'equipment', 'tank_id',
  'discharge_date', 'strategy', 'trade_number', 'destination',
] as const;

type ColumnField = typeof ALL_COLUMNS[number];

const PROFILES: Record<Exclude<ProfileName, 'Custom'>, ColumnField[]> = {
  All: [...ALL_COLUMNS],
  Scheduler: ['signal_id', 'refinery_tank_name', 'expected_volume', 'scheduled_date', 'equipment', 'tank_id', 'discharge_date', 'notes'],
  Trader: ['signal_id', 'nomination_key', 'expected_volume', 'scheduled_date', 'base_diff', 'quality_adj_diff', 'strategy', 'trade_number', 'destination'],
  Quality: ['signal_id', 'nomination_key', 'coa_api_gravity', 'coa_sulfur_content', 'coa_viscosity', 'coa_ash_content', 'quality_adj_diff', 'notes'],
};

export function getProfileVisibilityModel(profile: Exclude<ProfileName, 'Custom'>): GridColumnVisibilityModel {
  const visible = new Set(PROFILES[profile]);
  return Object.fromEntries(ALL_COLUMNS.map(col => [col, visible.has(col)]));
}

export function detectProfile(model: GridColumnVisibilityModel): ProfileName {
  for (const [name, cols] of Object.entries(PROFILES) as [Exclude<ProfileName, 'Custom'>, ColumnField[]][]) {
    const matches = ALL_COLUMNS.every(col => (model[col] !== false) === cols.includes(col));
    if (matches) return name;
  }
  return 'Custom';
}
