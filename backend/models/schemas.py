from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


class FeedstockType(str, Enum):
    CARBON_BLACK_OIL = "carbon_black_oil"
    OTHER = "other"


class MovementType(str, Enum):
    LOAD = "load"
    DISCHARGE = "discharge"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"


# Tank Models
class TankBase(BaseModel):
    name: str
    location: str = Field(description="Location/site name for the tank")
    feedstock_type: FeedstockType
    capacity: float = Field(gt=0, description="Tank capacity in liters")
    initial_level: float = Field(default=0.0, ge=0, description="Initial feedstock level in liters")


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    feedstock_type: Optional[FeedstockType] = None
    capacity: Optional[float] = Field(default=None, gt=0)


class Tank(TankBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.now)


class TankWithLevel(Tank):
    current_level: float = 0.0
    level_percentage: float = 0.0


# Movement Models
class MovementBase(BaseModel):
    type: MovementType
    tank_id: Optional[str] = None  # None = unassigned signal
    target_tank_id: Optional[str] = None  # Only for transfers
    expected_volume: float = Field(gt=0, description="Expected quantity in liters")
    actual_volume: Optional[float] = Field(default=None, ge=0, description="Actual quantity after completion")
    scheduled_date: date = Field(description="Date the movement is scheduled for")
    notes: Optional[str] = None
    # Signal metadata (for movements created from refinery signals)
    signal_id: Optional[str] = None  # Refinery's signal ID
    source_tank: Optional[str] = None  # Refinery tank name (external)
    # Trade information (filled separately from tank assignment)
    trade_number: Optional[str] = None
    trade_line_item: Optional[str] = None
    # Nomination key (derived from trade_number + trade_line_item for COA linking)
    nomination_key: Optional[str] = None
    # PDF reference (for adjustments imported from PDFs)
    pdf_url: Optional[str] = None


class MovementCreate(BaseModel):
    type: MovementType
    tank_id: str
    target_tank_id: Optional[str] = None
    expected_volume: float = Field(gt=0, description="Expected quantity in liters")
    scheduled_date: date = Field(description="Date the movement is scheduled for")
    notes: Optional[str] = None


class TransferTarget(BaseModel):
    tank_id: str
    volume: float = Field(gt=0, description="Transfer quantity in liters")


class TransferCreate(BaseModel):
    source_tank_id: str
    targets: list[TransferTarget]
    scheduled_date: date
    notes: Optional[str] = None


class MovementComplete(BaseModel):
    actual_volume: float = Field(gt=0, description="Actual quantity in liters")


class MovementUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    expected_volume: Optional[float] = Field(default=None, gt=0)
    notes: Optional[str] = None


class SignalAssignment(BaseModel):
    """Data for assigning a signal to a tank."""
    tank_id: str
    expected_volume: float = Field(gt=0)
    scheduled_date: date
    notes: Optional[str] = None


class TradeInfoUpdate(BaseModel):
    """Data for updating trade information on a signal."""
    trade_number: str
    trade_line_item: str


class Movement(MovementBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.now)


# Adjustment request (physical reading)
class AdjustmentCreate(BaseModel):
    tank_id: str
    physical_level: float = Field(ge=0, description="Actual physical reading in liters")
    notes: Optional[str] = None


# PDF Import Models
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


# Certificate of Analysis (COA) Models
class CertificateOfAnalysis(BaseModel):
    """Certificate of Analysis for carbon black oil shipments."""
    id: str = Field(default_factory=generate_id)
    signal_id: Optional[str] = None  # Links to Movement.signal_id
    nomination_key: Optional[str] = None  # For matching to signals

    # Source document info
    pdf_url: str  # Azure Blob URL
    extraction_date: datetime = Field(default_factory=datetime.now)

    # Extracted metadata
    analysis_date: Optional[date] = None
    refinery_equipment: Optional[str] = None  # Tank/equipment from refinery
    lab_name: Optional[str] = None

    # Chemical properties
    bmci: Optional[float] = None  # Bureau of Mines Correlation Index
    api_gravity: Optional[float] = None  # degrees
    specific_gravity: Optional[float] = None  # at 15.56°C
    viscosity: Optional[float] = None  # SUS or cSt
    viscosity_temp: Optional[str] = None  # "98.9°C" or "210°F"
    sulfur_content: Optional[float] = None  # wt%
    flash_point: Optional[float] = None  # °C
    ash_content: Optional[float] = None  # wt%
    moisture_content: Optional[float] = None  # wt%
    toluene_insoluble: Optional[float] = None  # wt%
    sodium_content: Optional[float] = None  # ppm

    # Raw extraction for debugging
    raw_extraction: Optional[dict] = None

    created_at: datetime = Field(default_factory=datetime.now)


class COAUploadRequest(BaseModel):
    """Request model for COA upload with optional signal linking."""
    signal_id: Optional[str] = None


class COALinkRequest(BaseModel):
    """Request to link a COA to a signal."""
    signal_id: str


class COAWithSignal(CertificateOfAnalysis):
    """COA with linked signal information."""
    signal: Optional[Movement] = None
