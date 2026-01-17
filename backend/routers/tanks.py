from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.schemas import (
    Tank, TankCreate, TankUpdate, TankWithLevel,
    Movement, DashboardStats
)
from services.storage import CosmosStorage
from services.calculations import get_tank_with_level

router = APIRouter()
tank_storage = CosmosStorage("tanks", Tank)
movement_storage = CosmosStorage("movements", Movement)


@router.get("", response_model=list[TankWithLevel])
def get_tanks(location: Optional[str] = Query(None)):
    """Get all tanks with calculated levels. Optionally filter by location."""
    tanks = tank_storage.get_all()
    movements = movement_storage.get_all()

    if location:
        tanks = [t for t in tanks if t.location == location]

    return [get_tank_with_level(tank, movements) for tank in tanks]


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard():
    """Get dashboard statistics."""
    tanks = tank_storage.get_all()
    movements = movement_storage.get_all()

    tanks_with_levels = [get_tank_with_level(t, movements) for t in tanks]
    total_volume = sum(t.current_level for t in tanks_with_levels)
    unique_locations = len(set(t.location for t in tanks))

    return DashboardStats(
        total_tanks=len(tanks),
        total_locations=unique_locations,
        total_feedstock_volume=round(total_volume, 2)
    )


@router.get("/{tank_id}", response_model=TankWithLevel)
def get_tank(tank_id: str):
    """Get a specific tank with calculated level."""
    tank = tank_storage.get_by_id(tank_id)
    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")

    movements = movement_storage.get_all()
    return get_tank_with_level(tank, movements)


@router.get("/{tank_id}/history", response_model=list[Movement])
def get_tank_history(tank_id: str):
    """Get movement history for a specific tank."""
    tank = tank_storage.get_by_id(tank_id)
    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")

    movements = movement_storage.get_all()
    # Filter movements related to this tank
    tank_movements = [
        m for m in movements
        if m.tank_id == tank_id or m.target_tank_id == tank_id
    ]
    # Sort by date descending
    tank_movements.sort(key=lambda m: m.created_at, reverse=True)
    return tank_movements


@router.post("", response_model=Tank, status_code=201)
def create_tank(tank_data: TankCreate):
    """Create a new tank."""
    tank = Tank(**tank_data.model_dump())
    return tank_storage.create(tank)


@router.put("/{tank_id}", response_model=Tank)
def update_tank(tank_id: str, tank_data: TankUpdate):
    """Update an existing tank."""
    tank = tank_storage.update(tank_id, tank_data.model_dump(exclude_unset=True))
    if not tank:
        raise HTTPException(status_code=404, detail="Tank not found")
    return tank


@router.delete("/{tank_id}", status_code=204)
def delete_tank(tank_id: str):
    """Delete a tank."""
    if not tank_storage.delete(tank_id):
        raise HTTPException(status_code=404, detail="Tank not found")
