export type FuelType = 'diesel' | 'gasoline' | 'other';
export type MovementType = 'load' | 'discharge' | 'transfer' | 'adjustment';

export interface Tank {
  id: string;
  name: string;
  location: string;
  fuel_type: FuelType;
  capacity: number;
  initial_level: number;
  created_at: string;
}

export interface TankWithLevel extends Tank {
  current_level: number;
  level_percentage: number;
}

export interface Movement {
  id: string;
  type: MovementType;
  tank_id: string;
  target_tank_id?: string;
  expected_volume: number;
  actual_volume: number | null;
  scheduled_date: string;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  total_tanks: number;
  total_locations: number;
  total_fuel_volume: number;
}

// Form types
export interface TankCreate {
  name: string;
  location: string;
  fuel_type: FuelType;
  capacity: number;
  initial_level?: number;
}

export interface MovementCreate {
  type: MovementType;
  tank_id: string;
  target_tank_id?: string;
  expected_volume: number;
  scheduled_date: string;
  notes?: string;
}

export interface MovementComplete {
  actual_volume: number;
}

export interface MovementUpdate {
  scheduled_date?: string;
  expected_volume?: number;
  notes?: string;
}

export interface AdjustmentCreate {
  tank_id: string;
  physical_level: number;
  notes?: string;
}

export interface Alert {
  tank_id: string;
  tank_name: string;
  level_percentage: number;
}

// PDF Import Types
export interface PDFExtractedMovement {
  tank_name: string;
  level_before: number;
  level_after: number;
  movement_qty: number;
  movement_date: string | null;
  row_index: number;
}

export interface TankMatchSuggestion {
  tank_id: string;
  tank_name: string;
  confidence: number;
}

export interface PDFMovementWithMatches {
  extracted: PDFExtractedMovement;
  movement_type: MovementType;
  suggested_matches: TankMatchSuggestion[];
  best_match: TankMatchSuggestion | null;
  is_exact_match: boolean;
}

export interface PDFExtractionResult {
  filename: string;
  movements: PDFMovementWithMatches[];
  extraction_errors: string[];
}

export interface PDFImportConfirmItem {
  tank_id: string;
  type: MovementType;
  volume: number;
  date: string;
  notes?: string;
}

export interface PDFImportRequest {
  movements: PDFImportConfirmItem[];
}

export interface PDFImportResult {
  created_count: number;
  failed_count: number;
  errors: string[];
}
