"""Tank-related models."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from .shared import FeedstockType, generate_id, utc_now


class TankBase(BaseModel):
    """Base tank model with common fields."""
    name: str
    location: str = Field(description="Location/site name for the tank")
    feedstock_type: FeedstockType
    capacity: float = Field(gt=0, description="Tank capacity in barrels")
    initial_level: float = Field(default=0.0, ge=0, description="Initial feedstock level in barrels")


class TankCreate(TankBase):
    """Model for creating a new tank."""
    pass


class TankUpdate(BaseModel):
    """Model for updating an existing tank."""
    name: Optional[str] = None
    location: Optional[str] = None
    feedstock_type: Optional[FeedstockType] = None
    capacity: Optional[float] = Field(default=None, gt=0)


class Tank(TankBase):
    """Complete tank model with ID and timestamp."""
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=utc_now)
    # Denormalized current level - updated when movements change
    current_level: float = Field(default=0.0, ge=0, description="Current tank level in barrels")


class TankWithLevel(Tank):
    """Tank with level percentage for display."""
    level_percentage: float = 0.0
