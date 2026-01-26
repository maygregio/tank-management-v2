"""Terminal aggregation API endpoints."""
import logging
from datetime import date

from fastapi import APIRouter, HTTPException, Query, Depends

from models.terminals import TerminalSummary, TerminalDailyAggregation
from services.terminal_service import TerminalService, get_terminal_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[TerminalSummary])
def get_terminals(
    service: TerminalService = Depends(get_terminal_service)
):
    """Get summary information for all terminals (locations)."""
    return service.get_terminal_summaries()


@router.get("/locations", response_model=list[str])
def get_locations(
    service: TerminalService = Depends(get_terminal_service)
):
    """Get list of unique terminal locations."""
    return service.get_unique_locations()


@router.get("/{location}/history", response_model=list[TerminalDailyAggregation])
def get_terminal_history(
    location: str,
    start_date: date = Query(..., description="Start date for aggregated history"),
    end_date: date = Query(..., description="End date for aggregated history"),
    service: TerminalService = Depends(get_terminal_service)
):
    """Get daily aggregated history for a terminal location.

    Returns daily data including:
    - total_level: Combined tank levels at end of day
    - net_movement: Net volume change (positive=inflow, negative=outflow)
    - Breakdown by movement type (loads, discharges, transfers, adjustments)
    """
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date"
        )

    history = service.get_aggregated_history(location, start_date, end_date)
    if not history:
        # Return empty list if no data (location might have no tanks or no movements)
        logger.info(f"No aggregated history for location: {location}")
        return []

    return history
