"""Certificate of Analysis (COA) related models."""
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, Field

from .shared import generate_id, utc_now

if TYPE_CHECKING:
    from .movements import Movement


class CertificateOfAnalysis(BaseModel):
    """Certificate of Analysis for carbon black oil shipments."""
    id: str = Field(default_factory=generate_id)
    signal_id: Optional[str] = None  # Links to Movement.signal_id
    nomination_key: Optional[str] = None  # For matching to signals

    # Source document info
    pdf_url: str  # Azure Blob URL
    extraction_date: datetime = Field(default_factory=utc_now)

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

    created_at: datetime = Field(default_factory=utc_now)


class COAUploadRequest(BaseModel):
    """Request model for COA upload with optional signal linking."""
    signal_id: Optional[str] = None


class COALinkRequest(BaseModel):
    """Request to link a COA to a signal."""
    signal_id: str


class COAWithSignal(CertificateOfAnalysis):
    """COA with linked signal information."""
    # Using Any to avoid circular import issues
    signal: Optional[dict] = None
