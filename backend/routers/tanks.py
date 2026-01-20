"""Tank management API endpoints."""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends

from models import Tank, TankCreate, TankUpdate, TankWithLevel, Movement
from services.tank_service import TankService, get_tank_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[TankWithLevel])
def get_tanks(
    location: Optional[str] = Query(None, description="Filter by location"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    service: TankService = Depends(get_tank_service)
):
    """Get all tanks with calculated levels. Optionally filter by location."""
    return service.get_all(location=location, skip=skip, limit=limit)


@router.get("/{tank_id}", response_model=TankWithLevel)
def get_tank(tank_id: str, service: TankService = Depends(get_tank_service)):
    """Get a specific tank with calculated level."""
    tank = service.get_by_id(tank_id)
    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")
    return tank


@router.get("/{tank_id}/history", response_model=list[Movement])
def get_tank_history(
    tank_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of records to return"),
    service: TankService = Depends(get_tank_service)
):
    """Get movement history for a specific tank."""
    history = service.get_history(tank_id, skip=skip, limit=limit)
    if history is None:
        raise HTTPException(status_code=404, detail="Tank not found")
    return history


@router.post("", response_model=Tank, status_code=201)
def create_tank(tank_data: TankCreate, service: TankService = Depends(get_tank_service)):
    """Create a new tank."""
    return service.create(tank_data)


@router.put("/{tank_id}", response_model=Tank)
def update_tank(
    tank_id: str,
    tank_data: TankUpdate,
    service: TankService = Depends(get_tank_service)
):
    """Update an existing tank."""
    tank = service.update(tank_id, tank_data)
    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")
    return tank


@router.delete("/{tank_id}", status_code=204)
def delete_tank(tank_id: str, service: TankService = Depends(get_tank_service)):
    """Delete a tank."""
    if not service.delete(tank_id):
        raise HTTPException(status_code=404, detail="Tank not found")
