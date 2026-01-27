"""Shared models and utilities used across the application."""
from datetime import datetime, timezone
from enum import Enum
from typing import TypeVar, Generic
import uuid

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model."""
    items: list[T]
    total: int
    skip: int
    limit: int


def generate_id() -> str:
    """Generate a unique ID for database records."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


class FeedstockType(str, Enum):
    """Types of feedstock stored in tanks."""
    CARBON_BLACK_OIL = "carbon_black_oil"
    OTHER = "other"


class MovementType(str, Enum):
    """Types of tank movements."""
    LOAD = "load"
    DISCHARGE = "discharge"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
