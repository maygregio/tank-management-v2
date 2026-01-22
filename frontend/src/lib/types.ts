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
  refinery_tank_name?: string;
  // Trade information
  trade_number?: string;
  trade_line_item?: string;
  // Nomination key for COA linking
  nomination_key?: string;
  // PDF reference (for adjustments imported from PDFs)
  pdf_url?: string;
  // Additional workflow fields
  strategy?: number;  // Trading strategy ID (Trader/Green)
  destination?: string;  // Final delivery terminal e.g., "IMTT" (Blender/Orange)
  equipment?: string;  // Barge/vessel info e.g., "WEB 241/248" (Transportation/Yellow)
  discharge_date?: string;  // Date of receipt at discharge location (Transportation/Yellow)
  base_diff?: number;  // Base price differential $/bbl (Trader/external)
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
  strategy?: number;
  destination?: string;
  equipment?: string;
  discharge_date?: string;
  base_diff?: number;
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
  strategy?: number;
  destination?: string;
  equipment?: string;
  discharge_date?: string;
  base_diff?: number;
}

export interface TradeInfoUpdate {
  trade_number: string;
  trade_line_item: string;
}

export interface ParsedSignal {
  signal_id: string;
  load_date: string;
  refinery_tank_name: string;
  volume: number;
}

export interface SignalUploadResult {
  signals: ParsedSignal[];
  errors: string[];
  created_count: number;
  skipped_count: number;
}

// Certificate of Analysis (COA) Types
export interface CertificateOfAnalysis {
  id: string;
  signal_id?: string;
  nomination_key?: string;
  pdf_url: string;
  extraction_date: string;
  analysis_date?: string;
  refinery_equipment?: string;
  lab_name?: string;
  // Chemical properties
  bmci?: number;
  api_gravity?: number;
  specific_gravity?: number;
  viscosity?: number;
  viscosity_temp?: string;
  sulfur_content?: number;
  flash_point?: number;
  ash_content?: number;
  moisture_content?: number;
  toluene_insoluble?: number;
  sodium_content?: number;
  raw_extraction?: Record<string, unknown>;
  created_at: string;
}

export interface COAWithSignal extends CertificateOfAnalysis {
  signal?: Movement;
}

export interface COALinkRequest {
  signal_id: string;
}

// Grid row types for DataGrid components
export interface SignalGridRow {
  id: string;
  signal_id: string;
  refinery_tank_name: string;
  load_date: string;
  volume: number;
  tank_id: string | null;
  tank_name: string | null;
  trade_number: string | null;
  trade_line_item: string | null;
}

export interface COAGridRow {
  id: string;
  nomination_key: string | null;
  signal_id: string | null;
  signal_name: string | null;
  analysis_date: string | null;
  bmci: number | null;
  sulfur_content: number | null;
  created_at: string;
}

export interface MovementGridRow {
  id: string;
  date: string;
  type: MovementType;
  tankName: string;
  expectedVolume: number;
  actualVolume: number | null;
  status: boolean;
  isFuture: boolean;
  notes: string;
}

export interface MovementSummaryStats {
  total: number;
  pending: number;
  completed: number;
  scheduledToday: number;
}

// Adjustment Import Types
export interface AdjustmentExtractedReading {
  tank_name: string;
  physical_level: number;
  inspection_date: string | null;
  row_index: number;
}

export interface AdjustmentMatchSuggestion {
  tank_id: string;
  tank_name: string;
  confidence: number;
}

export interface AdjustmentReadingWithMatches {
  extracted: AdjustmentExtractedReading;
  suggested_matches: AdjustmentMatchSuggestion[];
  best_match: AdjustmentMatchSuggestion | null;
  is_exact_match: boolean;
  system_level: number | null;
  delta: number | null;
}

export interface AdjustmentExtractionResult {
  filename: string;
  pdf_url: string | null;
  readings: AdjustmentReadingWithMatches[];
  extraction_errors: string[];
}

export interface AdjustmentImportConfirmItem {
  tank_id: string;
  physical_level: number;
  inspection_date: string;
  notes?: string;
}

export interface AdjustmentImportRequest {
  adjustments: AdjustmentImportConfirmItem[];
  pdf_url?: string;
}

export interface AdjustmentImportResult {
  created_count: number;
  failed_count: number;
  errors: string[];
}
