"""Shared models and utilities used across the application."""
from datetime import datetime, timezone
from enum import Enum
import uuid


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
