"""Movement-related models."""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, computed_field, model_validator

from .shared import MovementType, generate_id, utc_now


class MovementBase(BaseModel):
    """Base movement model with common fields."""
    type: MovementType
    target_tank_id: Optional[str] = None  # Only for transfers
    actual_volume: Optional[float] = Field(default=None, description="Actual quantity after completion (can be negative for adjustments)")
    # Resulting volume: tank level AFTER this movement (for source tank)
    resulting_volume: Optional[float] = Field(default=None, ge=0, description="Source tank volume after this movement")
    # Target resulting volume: target tank level AFTER this movement (for transfers only)
    target_resulting_volume: Optional[float] = Field(default=None, ge=0, description="Target tank volume after transfer")
    # Source tracking: how this movement was created (manual, pdf_import, signal, adjustment)
    source: Optional[str] = Field(default='manual', description="How the movement was created")
    # Signal metadata (for movements created from refinery signals)
    signal_id: Optional[str] = None  # Refinery's signal ID
    refinery_tank_name: Optional[str] = None  # Refinery tank name (external)
    # Nomination key (derived from trade_number + trade_line_item for COA linking)
    nomination_key: Optional[str] = None
    # PDF reference (for adjustments imported from PDFs)
    pdf_url: Optional[str] = None

    # === Paired Fields: System Defaults + Manual Overrides ===
    # For each field, _default stores system/import values, _manual stores user overrides

    # Tank assignment
    tank_id_default: Optional[str] = None
    tank_id_manual: Optional[str] = None

    # Volume and scheduling
    expected_volume_default: Optional[float] = Field(default=None, gt=0)
    expected_volume_manual: Optional[float] = Field(default=None, gt=0)
    scheduled_date_default: Optional[date] = None
    scheduled_date_manual: Optional[date] = None

    # Notes
    notes_default: Optional[str] = None
    notes_manual: Optional[str] = None

    # Trade information
    trade_number_default: Optional[str] = None
    trade_number_manual: Optional[str] = None
    trade_line_item_default: Optional[str] = None
    trade_line_item_manual: Optional[str] = None

    # Workflow fields
    strategy_default: Optional[int] = None
    strategy_manual: Optional[int] = None
    destination_default: Optional[str] = None
    destination_manual: Optional[str] = None
    equipment_default: Optional[str] = None
    equipment_manual: Optional[str] = None
    discharge_date_default: Optional[date] = None
    discharge_date_manual: Optional[date] = None
    base_diff_default: Optional[float] = None
    base_diff_manual: Optional[float] = None
    quality_adj_diff_default: Optional[float] = None
    quality_adj_diff_manual: Optional[float] = None

    # === Computed Fields: Effective Values (manual ?? default) ===

    @computed_field
    @property
    def tank_id(self) -> Optional[str]:
        return self.tank_id_manual if self.tank_id_manual is not None else self.tank_id_default

    @computed_field
    @property
    def expected_volume(self) -> Optional[float]:
        return self.expected_volume_manual if self.expected_volume_manual is not None else self.expected_volume_default

    @computed_field
    @property
    def scheduled_date(self) -> Optional[date]:
        return self.scheduled_date_manual if self.scheduled_date_manual is not None else self.scheduled_date_default

    @computed_field
    @property
    def notes(self) -> Optional[str]:
        return self.notes_manual if self.notes_manual is not None else self.notes_default

    @computed_field
    @property
    def trade_number(self) -> Optional[str]:
        return self.trade_number_manual if self.trade_number_manual is not None else self.trade_number_default

    @computed_field
    @property
    def trade_line_item(self) -> Optional[str]:
        return self.trade_line_item_manual if self.trade_line_item_manual is not None else self.trade_line_item_default

    @computed_field
    @property
    def strategy(self) -> Optional[int]:
        return self.strategy_manual if self.strategy_manual is not None else self.strategy_default

    @computed_field
    @property
    def destination(self) -> Optional[str]:
        return self.destination_manual if self.destination_manual is not None else self.destination_default

    @computed_field
    @property
    def equipment(self) -> Optional[str]:
        return self.equipment_manual if self.equipment_manual is not None else self.equipment_default

    @computed_field
    @property
    def discharge_date(self) -> Optional[date]:
        return self.discharge_date_manual if self.discharge_date_manual is not None else self.discharge_date_default

    @computed_field
    @property
    def base_diff(self) -> Optional[float]:
        return self.base_diff_manual if self.base_diff_manual is not None else self.base_diff_default

    @computed_field
    @property
    def quality_adj_diff(self) -> Optional[float]:
        return self.quality_adj_diff_manual if self.quality_adj_diff_manual is not None else self.quality_adj_diff_default

    @model_validator(mode='after')
    def validate_actual_volume(self) -> 'MovementBase':
        """Validate actual_volume: non-negative for all types except ADJUSTMENT."""
        if self.actual_volume is not None and self.actual_volume < 0:
            if self.type != MovementType.ADJUSTMENT:
                raise ValueError('actual_volume must be non-negative for non-adjustment movements')
        return self


class MovementCreate(BaseModel):
    """Model for creating a new movement (values go to _default fields)."""
    type: MovementType
    tank_id: str  # Goes to tank_id_default
    target_tank_id: Optional[str] = None
    expected_volume: float = Field(gt=0, description="Expected quantity in barrels")  # Goes to expected_volume_default
    scheduled_date: date = Field(description="Date the movement is scheduled for")  # Goes to scheduled_date_default
    notes: Optional[str] = None  # Goes to notes_default
    source: str = Field(default='manual', description="How the movement was created (manual, pdf_import)")


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
    """Model for updating a pending movement (all fields are manual overrides)."""
    scheduled_date_manual: Optional[date] = None
    expected_volume_manual: Optional[float] = Field(default=None, gt=0)
    notes_manual: Optional[str] = None
    tank_id_manual: Optional[str] = None
    trade_number_manual: Optional[str] = None
    trade_line_item_manual: Optional[str] = None
    strategy_manual: Optional[int] = None
    destination_manual: Optional[str] = None
    equipment_manual: Optional[str] = None
    discharge_date_manual: Optional[date] = None
    base_diff_manual: Optional[float] = None
    quality_adj_diff_manual: Optional[float] = None


class SignalAssignment(BaseModel):
    """Data for assigning a signal to a tank (all fields are manual overrides)."""
    tank_id_manual: str
    expected_volume_manual: float = Field(gt=0)
    scheduled_date_manual: date
    notes_manual: Optional[str] = None
    strategy_manual: Optional[int] = None
    destination_manual: Optional[str] = None
    equipment_manual: Optional[str] = None
    discharge_date_manual: Optional[date] = None
    base_diff_manual: Optional[float] = None
    quality_adj_diff_manual: Optional[float] = None


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


class MovementWithCOA(Movement):
    """Movement with joined COA chemical properties for overview display."""
    # COA chemical properties (joined from CertificateOfAnalysis)
    coa_api_gravity: Optional[float] = None
    coa_sulfur_content: Optional[float] = None
    coa_viscosity: Optional[float] = None
    coa_ash_content: Optional[float] = None
