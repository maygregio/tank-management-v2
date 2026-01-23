from datetime import date

from models import Tank, Movement, MovementType, TankWithLevel


def get_effective_volume(movement: Movement) -> float:
    """Return actual_volume if set, otherwise expected_volume."""
    if movement.actual_volume is not None:
        return movement.actual_volume
    return movement.expected_volume


def calculate_tank_level(tank: Tank, movements: list[Movement], as_of: date | None = None) -> float:
    """Calculate current tank level based on initial level and movements."""
    level = tank.initial_level
    cutoff = as_of or date.today()

    for movement in movements:
        if movement.scheduled_date > cutoff:
            continue
        volume = get_effective_volume(movement)
        if movement.type == MovementType.LOAD and movement.tank_id == tank.id:
            level += volume
        elif movement.type == MovementType.DISCHARGE and movement.tank_id == tank.id:
            level -= volume
        elif movement.type == MovementType.TRANSFER:
            if movement.tank_id == tank.id:
                # Transfer out
                level -= volume
            elif movement.target_tank_id == tank.id:
                # Transfer in
                level += volume
        elif movement.type == MovementType.ADJUSTMENT and movement.tank_id == tank.id:
            # Adjustment can be positive or negative
            level += volume

    return max(0, level)  # Level can't be negative


def get_tank_with_level(tank: Tank, movements: list[Movement]) -> TankWithLevel:
    """Get tank data with calculated level information."""
    current_level = calculate_tank_level(tank, movements)
    level_percentage = (current_level / tank.capacity * 100) if tank.capacity > 0 else 0

    return TankWithLevel(
        **tank.model_dump(),
        current_level=round(current_level, 2),
        level_percentage=round(level_percentage, 2)
    )


def calculate_adjustment(current_level: float, physical_level: float) -> float:
    """Calculate the adjustment quantity needed to match physical reading."""
    return physical_level - current_level
