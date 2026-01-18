"""PDF import-related models."""
from datetime import date
from typing import Optional
from pydantic import BaseModel

from .shared import MovementType


class PDFExtractedMovement(BaseModel):
    """Raw movement data extracted from PDF."""
    tank_name: str
    level_before: float
    level_after: float
    movement_qty: float
    movement_date: Optional[date] = None
    row_index: int


class TankMatchSuggestion(BaseModel):
    """Tank match with confidence score."""
    tank_id: str
    tank_name: str
    confidence: float  # 0-100


class PDFMovementWithMatches(BaseModel):
    """Extracted movement with tank matching suggestions."""
    extracted: PDFExtractedMovement
    movement_type: MovementType
    suggested_matches: list[TankMatchSuggestion]
    best_match: Optional[TankMatchSuggestion] = None
    is_exact_match: bool = False


class PDFExtractionResult(BaseModel):
    """Result from PDF extraction."""
    filename: str
    movements: list[PDFMovementWithMatches]
    extraction_errors: list[str] = []


class PDFImportConfirmItem(BaseModel):
    """Single movement to import."""
    tank_id: str
    type: MovementType
    volume: float
    date: date
    notes: Optional[str] = None


class PDFImportRequest(BaseModel):
    """Request to confirm and import movements."""
    movements: list[PDFImportConfirmItem]


class PDFImportResult(BaseModel):
    """Result from importing movements."""
    created_count: int
    failed_count: int
    errors: list[str] = []
