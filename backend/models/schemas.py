from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


class FuelType(str, Enum):
    DIESEL = "diesel"
    GASOLINE = "gasoline"
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
    fuel_type: FuelType
    capacity: float = Field(gt=0, description="Tank capacity in liters")
    initial_level: float = Field(default=0.0, ge=0, description="Initial fuel level in liters")


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    fuel_type: Optional[FuelType] = None
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
    tank_id: str
    target_tank_id: Optional[str] = None  # Only for transfers
    expected_volume: float = Field(gt=0, description="Expected quantity in liters")
    actual_volume: Optional[float] = Field(default=None, ge=0, description="Actual quantity after completion")
    scheduled_date: date = Field(description="Date the movement is scheduled for")
    notes: Optional[str] = None


class MovementCreate(BaseModel):
    type: MovementType
    tank_id: str
    target_tank_id: Optional[str] = None
    expected_volume: float = Field(gt=0, description="Expected quantity in liters")
    scheduled_date: date = Field(description="Date the movement is scheduled for")
    notes: Optional[str] = None


class MovementComplete(BaseModel):
    actual_volume: float = Field(gt=0, description="Actual quantity in liters")


class MovementUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    expected_volume: Optional[float] = Field(default=None, gt=0)
    notes: Optional[str] = None


class Movement(MovementBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.now)


# Adjustment request (physical reading)
class AdjustmentCreate(BaseModel):
    tank_id: str
    physical_level: float = Field(ge=0, description="Actual physical reading in liters")
    notes: Optional[str] = None


# Dashboard Models
class DashboardStats(BaseModel):
    total_tanks: int
    total_locations: int
    total_fuel_volume: float
