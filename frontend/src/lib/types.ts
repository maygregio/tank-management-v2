export type FeedstockType = 'carbon_black_oil' | 'other';
export type MovementType = 'load' | 'discharge' | 'transfer' | 'adjustment';

export interface Tank {
  id: string;
  name: string;
  location: string;
  feedstock_type: FeedstockType;
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
  tank_id: string | null;  // null = unassigned signal
  target_tank_id?: string;
  expected_volume: number;
  actual_volume: number | null;
  scheduled_date: string;
  notes?: string;
  created_at: string;
  // Signal metadata
  signal_id?: string;
  source_tank?: string;
}

export interface DashboardStats {
  total_tanks: number;
  total_locations: number;
  total_feedstock_volume: number;
}

// Form types
export interface TankCreate {
  name: string;
  location: string;
  feedstock_type: FeedstockType;
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

export interface TransferTargetCreate {
  tank_id: string;
  volume: number;
}

export interface TransferCreate {
  source_tank_id: string;
  targets: TransferTargetCreate[];
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

// Signal types
export interface SignalAssignment {
  tank_id: string;
  expected_volume: number;
  scheduled_date: string;
  notes?: string;
}

export interface ParsedSignal {
  signal_id: string;
  load_date: string;
  source_tank: string;
  volume: number;
}

export interface SignalUploadResult {
  signals: ParsedSignal[];
  errors: string[];
  created_count: number;
  skipped_count: number;
}
