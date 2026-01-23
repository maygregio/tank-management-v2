import type { GridColumnVisibilityModel } from '@mui/x-data-grid';

const STORAGE_KEY = 'overview-column-preferences';

export interface ColumnPreferences {
  visibilityModel: GridColumnVisibilityModel;
  profileName: string;
}

export function saveColumnPreferences(preferences: ColumnPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {}
}

export function loadColumnPreferences(): ColumnPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
