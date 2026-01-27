"""Movement management API endpoints."""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends

from models import (
    Movement, MovementCreate, MovementComplete, MovementUpdate, MovementType,
    AdjustmentCreate, TransferCreate, MovementWithCOA
)
from models.shared import PaginatedResponse
from services.movement_service import MovementService, MovementServiceError, get_movement_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=PaginatedResponse[Movement])
def get_movements(
    tank_id: Optional[str] = Query(None, description="Filter by tank ID"),
    type: Optional[MovementType] = Query(None, description="Filter by movement type"),
    status: Optional[str] = Query(None, description="Filter by status: pending or completed"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    service: MovementService = Depends(get_movement_service)
):
    """Get all movements with optional filters (paginated)."""
    return service.get_all(
        tank_id=tank_id,
        movement_type=type,
        status=status,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=Movement, status_code=201)
def create_movement(
    movement_data: MovementCreate,
    service: MovementService = Depends(get_movement_service)
):
    """Create a new scheduled movement (load, discharge, transfer)."""
    try:
        return service.create(movement_data)
    except MovementServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/transfer", response_model=list[Movement], status_code=201)
def create_transfer(
    movement_data: TransferCreate,
    service: MovementService = Depends(get_movement_service)
):
    """Create a transfer from one source tank to multiple targets."""
    try:
        return service.create_transfer(movement_data)
    except MovementServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/overview", response_model=PaginatedResponse[MovementWithCOA])
def get_overview(
    tank_id: Optional[str] = Query(None, description="Filter by tank ID"),
    type: Optional[MovementType] = Query(None, description="Filter by movement type"),
    status: Optional[str] = Query(None, description="Filter by status: pending or completed"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    service: MovementService = Depends(get_movement_service)
):
    """Get movements with joined COA chemical properties for overview display (paginated)."""
    return service.get_overview(
        tank_id=tank_id,
        movement_type=type,
        status=status,
        skip=skip,
        limit=limit
    )


@router.put("/{movement_id}", response_model=Movement)
def update_movement(
    movement_id: str,
    data: MovementUpdate,
    service: MovementService = Depends(get_movement_service)
):
    """Update a pending movement's date, expected volume, or notes."""
    try:
        return service.update(movement_id, data)
    except MovementServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{movement_id}/complete", response_model=Movement)
def complete_movement(
    movement_id: str,
    data: MovementComplete,
    service: MovementService = Depends(get_movement_service)
):
    """Record actual volume for a scheduled movement."""
    try:
        return service.complete(movement_id, data)
    except MovementServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/adjustment", response_model=Movement, status_code=201)
def create_adjustment(
    adjustment_data: AdjustmentCreate,
    service: MovementService = Depends(get_movement_service)
):
    """Create an adjustment movement based on physical reading."""
    try:
        return service.create_adjustment(adjustment_data)
    except MovementServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{movement_id}", status_code=204)
def delete_movement(
    movement_id: str,
    service: MovementService = Depends(get_movement_service)
):
    """Delete a movement."""
    if not service.delete(movement_id):
        raise HTTPException(status_code=404, detail="Movement not found")
