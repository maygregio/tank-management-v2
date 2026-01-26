"""Terminal aggregation models for location-based tank grouping."""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class TerminalSummary(BaseModel):
    """Summary information for a terminal (location)."""
    location: str = Field(description="Terminal location name")
    tank_count: int = Field(ge=0, description="Number of tanks at this location")
    total_capacity: float = Field(ge=0, description="Combined capacity of all tanks in barrels")
    current_total_level: float = Field(ge=0, description="Combined current level of all tanks in barrels")
    utilization_percentage: float = Field(ge=0, le=100, description="Current utilization as percentage")


class TerminalDailyAggregation(BaseModel):
    """Aggregated daily data for a terminal."""
    model_config = {"populate_by_name": True}

    record_date: date = Field(description="Date of the aggregation", alias="date")
    total_level: float = Field(ge=0, description="Combined tank levels at end of day in barrels")
    total_capacity: float = Field(ge=0, description="Combined capacity of all tanks in barrels")
    net_movement: float = Field(description="Net movement for the day (positive=inflow, negative=outflow)")
    loads_volume: float = Field(ge=0, default=0, description="Total volume loaded on this day")
    discharges_volume: float = Field(ge=0, default=0, description="Total volume discharged on this day")
    transfers_in_volume: float = Field(ge=0, default=0, description="Total volume transferred in on this day")
    transfers_out_volume: float = Field(ge=0, default=0, description="Total volume transferred out on this day")
    adjustments_volume: float = Field(default=0, description="Net adjustment volume on this day")
    utilization_percentage: float = Field(ge=0, le=100, description="Utilization at end of day")
