from datetime import date
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional
from models.schemas import (
    Movement, MovementCreate, MovementComplete, MovementUpdate, MovementType,
    Tank, AdjustmentCreate, TransferCreate, SignalAssignment
)
from services.storage import CosmosStorage
from services.calculations import calculate_tank_level, calculate_adjustment
from services.excel_parser import parse_signals_excel, ExcelParseResult

router = APIRouter()
movement_storage = CosmosStorage("movements", Movement)
tank_storage = CosmosStorage("tanks", Tank)


@router.get("", response_model=list[Movement])
def get_movements(
    tank_id: Optional[str] = Query(None),
    type: Optional[MovementType] = Query(None),
    status: Optional[str] = Query(None, description="Filter by status: pending or completed"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all movements with optional filters."""
    movements = movement_storage.get_all()

    if tank_id:
        movements = [
            m for m in movements
            if m.tank_id == tank_id or m.target_tank_id == tank_id
        ]

    if type:
        movements = [m for m in movements if m.type == type]

    if status:
        if status == "pending":
            movements = [m for m in movements if m.actual_volume is None]
        elif status == "completed":
            movements = [m for m in movements if m.actual_volume is not None]

    # Sort by scheduled_date descending
    movements.sort(key=lambda m: m.scheduled_date, reverse=True)
    return movements[:limit]


@router.post("", response_model=Movement, status_code=201)
def create_movement(movement_data: MovementCreate):
    """Create a new scheduled movement (load, discharge, transfer)."""
    # Validate tank exists
    tank = tank_storage.get_by_id(movement_data.tank_id)
    if not tank:
        raise HTTPException(status_code=400, detail="Tank not found")

    # Validate transfer target tank
    if movement_data.type == MovementType.TRANSFER:
        if not movement_data.target_tank_id:
            raise HTTPException(
                status_code=400,
                detail="Target tank is required for transfers"
            )
        target_tank = tank_storage.get_by_id(movement_data.target_tank_id)
        if not target_tank:
            raise HTTPException(status_code=400, detail="Target tank not found")
        if movement_data.tank_id == movement_data.target_tank_id:
            raise HTTPException(
                status_code=400,
                detail="Source and target tank cannot be the same"
            )

    # For discharge/transfer, verify sufficient fuel (using expected volume)
    if movement_data.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
        movements = movement_storage.get_all()
        current_level = calculate_tank_level(tank, movements)
        if movement_data.expected_volume > current_level:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient feedstock. Current level: {current_level:.2f}L"
            )

    # Create movement with expected_volume, actual_volume starts as None
    movement = Movement(
        type=movement_data.type,
        tank_id=movement_data.tank_id,
        target_tank_id=movement_data.target_tank_id,
        expected_volume=movement_data.expected_volume,
        actual_volume=None,
        scheduled_date=movement_data.scheduled_date,
        notes=movement_data.notes
    )
    return movement_storage.create(movement)


@router.post("/transfer", response_model=list[Movement], status_code=201)
def create_transfer(movement_data: TransferCreate):
    """Create a transfer from one source tank to multiple targets."""
    source_tank = tank_storage.get_by_id(movement_data.source_tank_id)
    if not source_tank:
        raise HTTPException(status_code=400, detail="Source tank not found")

    if not movement_data.targets:
        raise HTTPException(status_code=400, detail="At least one target is required")

    target_ids = [target.tank_id for target in movement_data.targets]
    if movement_data.source_tank_id in target_ids:
        raise HTTPException(status_code=400, detail="Source and target tank cannot be the same")

    total_volume = sum(target.volume for target in movement_data.targets)
    movements = movement_storage.get_all()
    current_level = calculate_tank_level(source_tank, movements)
    if total_volume > current_level:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient feedstock. Current level: {current_level:.2f}L"
        )

    created_movements: list[Movement] = []
    for target in movement_data.targets:
        target_tank = tank_storage.get_by_id(target.tank_id)
        if not target_tank:
            raise HTTPException(status_code=400, detail=f"Target tank not found: {target.tank_id}")
        movement = Movement(
            type=MovementType.TRANSFER,
            tank_id=movement_data.source_tank_id,
            target_tank_id=target.tank_id,
            expected_volume=target.volume,
            actual_volume=None,
            scheduled_date=movement_data.scheduled_date,
            notes=movement_data.notes,
        )
        created_movements.append(movement_storage.create(movement))

    return created_movements


@router.put("/{movement_id}", response_model=Movement)
def update_movement(movement_id: str, data: MovementUpdate):
    """Update a pending movement's date, expected volume, or notes."""
    movement = movement_storage.get_by_id(movement_id)
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    if movement.actual_volume is not None:
        raise HTTPException(status_code=400, detail="Cannot edit completed movements")

    # Build update dict with only provided fields
    update_data = {}
    if data.scheduled_date is not None:
        update_data["scheduled_date"] = data.scheduled_date
    if data.expected_volume is not None:
        # Validate sufficient fuel for discharge/transfer
        if movement.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
            tank = tank_storage.get_by_id(movement.tank_id)
            if not tank:
                raise HTTPException(status_code=400, detail="Tank not found")
            movements = movement_storage.get_all()
            current_level = calculate_tank_level(tank, movements)
            # Add back the old expected volume since it was already "reserved"
            available = current_level + movement.expected_volume
            if data.expected_volume > available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient feedstock. Available: {available:.2f}L"
                )
        update_data["expected_volume"] = data.expected_volume
    if data.notes is not None:
        update_data["notes"] = data.notes

    if not update_data:
        return movement

    updated = movement_storage.update(movement_id, update_data)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update movement")

    return updated


@router.put("/{movement_id}/complete", response_model=Movement)
def complete_movement(movement_id: str, data: MovementComplete):
    """Record actual volume for a scheduled movement."""
    movement = movement_storage.get_by_id(movement_id)
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    if movement.actual_volume is not None:
        raise HTTPException(status_code=400, detail="Movement already completed")

    # Update with actual volume
    updated = movement_storage.update(movement_id, {"actual_volume": data.actual_volume})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update movement")

    return updated


@router.post("/adjustment", response_model=Movement, status_code=201)
def create_adjustment(adjustment_data: AdjustmentCreate):
    """
    Create an adjustment movement based on physical reading.
    Calculates the difference between current calculated level and physical reading.
    """
    # Validate tank exists
    tank = tank_storage.get_by_id(adjustment_data.tank_id)
    if not tank:
        raise HTTPException(status_code=400, detail="Tank not found")

    # Validate physical level doesn't exceed capacity
    if adjustment_data.physical_level > tank.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Physical level cannot exceed tank capacity ({tank.capacity}L)"
        )

    # Calculate current level
    movements = movement_storage.get_all()
    current_level = calculate_tank_level(tank, movements)

    # Calculate adjustment quantity
    adjustment_quantity = calculate_adjustment(current_level, adjustment_data.physical_level)

    # Create adjustment movement (adjustments are immediately complete)
    notes = adjustment_data.notes or f"Physical reading adjustment. Previous: {current_level:.2f}L, Physical: {adjustment_data.physical_level:.2f}L"
    if adjustment_quantity < 0:
        notes = f"(Loss) {notes}"
    else:
        notes = f"(Gain) {notes}"

    movement = Movement(
        type=MovementType.ADJUSTMENT,
        tank_id=adjustment_data.tank_id,
        expected_volume=abs(adjustment_quantity),
        actual_volume=adjustment_quantity,  # Adjustments are immediately complete with signed value
        scheduled_date=date.today(),
        notes=notes
    )

    return movement_storage.create(movement)


# Signal endpoints
@router.get("/signals", response_model=list[Movement])
def get_unassigned_signals():
    """Get all unassigned signals (movements with tank_id=None)."""
    movements = movement_storage.get_all()
    # Filter for unassigned signals (tank_id is None and signal_id is set)
    signals = [m for m in movements if m.tank_id is None and m.signal_id is not None]
    # Sort by scheduled_date descending
    signals.sort(key=lambda m: m.scheduled_date, reverse=True)
    return signals


class SignalUploadResult(ExcelParseResult):
    """Result from uploading signals."""
    created_count: int = 0


@router.post("/signals/upload", response_model=SignalUploadResult)
async def upload_signals(file: UploadFile = File(...)):
    """Upload an Excel file with refinery signals and create movements."""
    # Validate file type
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")

    # Read file content
    content = await file.read()

    # Parse Excel
    parse_result = parse_signals_excel(content)

    # Create movements for each signal
    created_count = 0
    for signal in parse_result.signals:
        movement = Movement(
            type=MovementType.LOAD,  # Signals are incoming loads
            tank_id=None,  # Unassigned
            expected_volume=signal.volume,
            scheduled_date=signal.load_date,
            signal_id=signal.signal_id,
            source_tank=signal.source_tank,
            notes=f"Signal from refinery tank: {signal.source_tank}"
        )
        movement_storage.create(movement)
        created_count += 1

    return SignalUploadResult(
        signals=parse_result.signals,
        errors=parse_result.errors,
        created_count=created_count
    )


@router.put("/{movement_id}/assign", response_model=Movement)
def assign_signal(movement_id: str, data: SignalAssignment):
    """Assign an unassigned signal to a tank."""
    movement = movement_storage.get_by_id(movement_id)
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    # Verify this is an unassigned signal
    if movement.tank_id is not None:
        raise HTTPException(status_code=400, detail="Movement is already assigned to a tank")

    if movement.signal_id is None:
        raise HTTPException(status_code=400, detail="Movement is not a signal")

    # Validate tank exists
    tank = tank_storage.get_by_id(data.tank_id)
    if not tank:
        raise HTTPException(status_code=400, detail="Tank not found")

    # Update the movement with assignment data
    update_data = {
        "tank_id": data.tank_id,
        "expected_volume": data.expected_volume,
        "scheduled_date": data.scheduled_date,
    }
    if data.notes is not None:
        update_data["notes"] = data.notes

    updated = movement_storage.update(movement_id, update_data)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to assign signal")

    return updated


@router.delete("/{movement_id}", status_code=204)
def delete_movement(movement_id: str):
    """Delete a movement."""
    if not movement_storage.delete(movement_id):
        raise HTTPException(status_code=404, detail="Movement not found")
