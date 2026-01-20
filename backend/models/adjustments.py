"""Adjustment import-related models."""
from datetime import date
from typing import Optional
from pydantic import BaseModel


class AdjustmentExtractedReading(BaseModel):
    """Raw adjustment reading extracted from PDF."""
    tank_name: str
    physical_level: float
    inspection_date: Optional[date] = None
    row_index: int


class AdjustmentMatchSuggestion(BaseModel):
    """Tank match with confidence score."""
    tank_id: str
    tank_name: str
    confidence: float  # 0-100


class AdjustmentReadingWithMatches(BaseModel):
    """Extracted reading with tank matching suggestions and delta calculation."""
    extracted: AdjustmentExtractedReading
    suggested_matches: list[AdjustmentMatchSuggestion]
    best_match: Optional[AdjustmentMatchSuggestion] = None
    is_exact_match: bool = False
    # Calculated delta (physical_level - system_level)
    system_level: Optional[float] = None
    delta: Optional[float] = None


class AdjustmentExtractionResult(BaseModel):
    """Result from adjustment PDF extraction."""
    filename: str
    pdf_url: Optional[str] = None
    readings: list[AdjustmentReadingWithMatches]
    extraction_errors: list[str] = []


class AdjustmentImportConfirmItem(BaseModel):
    """Single adjustment to import."""
    tank_id: str
    physical_level: float
    inspection_date: date
    notes: Optional[str] = None


class AdjustmentImportRequest(BaseModel):
    """Request to confirm and import adjustments."""
    adjustments: list[AdjustmentImportConfirmItem]
    pdf_url: Optional[str] = None


class AdjustmentImportResult(BaseModel):
    """Result from importing adjustments."""
    created_count: int
    failed_count: int
    errors: list[str] = []
