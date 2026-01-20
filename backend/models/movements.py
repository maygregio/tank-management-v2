"""Movement-related models."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

from .shared import MovementType, generate_id, utc_now


class MovementBase(BaseModel):
    """Base movement model with common fields."""
    type: MovementType
    tank_id: Optional[str] = None  # None = unassigned signal
    target_tank_id: Optional[str] = None  # Only for transfers
    expected_volume: float = Field(gt=0, description="Expected quantity in barrels")
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
    """Model for creating a new movement."""
    type: MovementType
    tank_id: str
    target_tank_id: Optional[str] = None
    expected_volume: float = Field(gt=0, description="Expected quantity in barrels")
    scheduled_date: date = Field(description="Date the movement is scheduled for")
    notes: Optional[str] = None


class TransferTarget(BaseModel):
    """Target tank for a transfer operation."""
    tank_id: str
    volume: float = Field(gt=0, description="Transfer quantity in barrels")


class TransferCreate(BaseModel):
    """Model for creating a multi-target transfer."""
    source_tank_id: str
    targets: list[TransferTarget]
    scheduled_date: date
    notes: Optional[str] = None


class MovementComplete(BaseModel):
    """Model for completing a movement with actual volume."""
    actual_volume: float = Field(gt=0, description="Actual quantity in barrels")


class MovementUpdate(BaseModel):
    """Model for updating a pending movement."""
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
    """Complete movement model with ID and timestamp."""
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=utc_now)


class AdjustmentCreate(BaseModel):
    """Model for creating a physical reading adjustment."""
    tank_id: str
    physical_level: float = Field(ge=0, description="Actual physical reading in barrels")
    notes: Optional[str] = None
