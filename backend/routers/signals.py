"""Signal management API endpoints."""
import logging

from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File

from models import Movement, SignalAssignment, TradeInfoUpdate
from models.shared import PaginatedResponse
from services.signal_service import (
    SignalService,
    SignalServiceError,
    SignalUploadResult,
    get_signal_service
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=PaginatedResponse[Movement])
def get_pending_signals(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    service: SignalService = Depends(get_signal_service)
):
    """Get signals that need work (unassigned OR missing trade info, paginated)."""
    return service.get_pending_signals(skip=skip, limit=limit)


@router.post("/upload", response_model=SignalUploadResult)
async def upload_signals(
    file: UploadFile = File(...),
    service: SignalService = Depends(get_signal_service)
):
    """Upload an Excel file with refinery signals and create movements."""
    if not file.filename or not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx)")

    content = await file.read()
    return service.upload_signals(content)


@router.put("/{movement_id}/assign", response_model=Movement)
def assign_signal(
    movement_id: str,
    data: SignalAssignment,
    service: SignalService = Depends(get_signal_service)
):
    """Assign an unassigned signal to a tank."""
    try:
        return service.assign_signal(movement_id, data)
    except SignalServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{movement_id}/trade", response_model=Movement)
def update_trade_info(
    movement_id: str,
    data: TradeInfoUpdate,
    service: SignalService = Depends(get_signal_service)
):
    """Update trade information on a signal."""
    try:
        return service.update_trade_info(movement_id, data)
    except SignalServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
