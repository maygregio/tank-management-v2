from datetime import date

from models import Tank, Movement, MovementType, TankWithLevel


def get_effective_volume(movement: Movement) -> float:
    """Return actual_volume if set, otherwise expected_volume."""
    if movement.actual_volume is not None:
        return movement.actual_volume
    return movement.expected_volume or 0


def calculate_tank_level(tank: Tank, movements: list[Movement], as_of: date | None = None) -> float:
    """Calculate tank level from scratch based on initial level and movements.

    This is kept for verification/reconciliation purposes. For normal operations,
    use the stored tank.current_level and movement.resulting_volume instead.
    """
    level = tank.initial_level
    cutoff = as_of or date.today()

    for movement in movements:
        if movement.scheduled_date and movement.scheduled_date > cutoff:
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


def get_tank_with_level(tank: Tank) -> TankWithLevel:
    """Get tank data with level percentage for display.

    Uses the stored current_level rather than recalculating from movements.
    """
    level_percentage = (tank.current_level / tank.capacity * 100) if tank.capacity > 0 else 0

    return TankWithLevel(
        **tank.model_dump(),
        level_percentage=round(level_percentage, 2)
    )


def calculate_adjustment(current_level: float, physical_level: float) -> float:
    """Calculate the adjustment quantity needed to match physical reading."""
    return physical_level - current_level


def apply_movement_to_level(level: float, movement: Movement, tank_id: str) -> float:
    """Apply a single movement's effect to a tank level.

    Args:
        level: Current tank level before this movement
        movement: The movement to apply
        tank_id: The tank we're calculating for

    Returns:
        New tank level after this movement
    """
    volume = get_effective_volume(movement)

    if movement.type == MovementType.LOAD and movement.tank_id == tank_id:
        level += volume
    elif movement.type == MovementType.DISCHARGE and movement.tank_id == tank_id:
        level -= volume
    elif movement.type == MovementType.TRANSFER:
        if movement.tank_id == tank_id:
            # Transfer out
            level -= volume
        elif movement.target_tank_id == tank_id:
            # Transfer in
            level += volume
    elif movement.type == MovementType.ADJUSTMENT and movement.tank_id == tank_id:
        # Adjustment can be positive or negative
        level += volume

    return max(0, level)


def get_volume_delta(movement: Movement, tank_id: str) -> float:
    """Get the volume change this movement causes for a specific tank.

    Returns positive for inflows, negative for outflows, 0 if not affected.
    """
    volume = get_effective_volume(movement)

    if movement.type == MovementType.LOAD and movement.tank_id == tank_id:
        return volume
    elif movement.type == MovementType.DISCHARGE and movement.tank_id == tank_id:
        return -volume
    elif movement.type == MovementType.TRANSFER:
        if movement.tank_id == tank_id:
            return -volume  # Transfer out
        elif movement.target_tank_id == tank_id:
            return volume  # Transfer in
    elif movement.type == MovementType.ADJUSTMENT and movement.tank_id == tank_id:
        return volume  # Can be positive or negative

    return 0


def recalculate_resulting_volumes(
    movements: list[Movement],
    tank: Tank,
    starting_volume: float | None = None
) -> list[tuple[str, float]]:
    """Recalculate resulting_volume for a list of movements.

    Args:
        movements: Movements to recalculate, should be sorted by scheduled_date ASC
        tank: The tank these movements affect
        starting_volume: Starting level, defaults to tank.initial_level

    Returns:
        List of (movement_id, resulting_volume) tuples
    """
    level = starting_volume if starting_volume is not None else tank.initial_level
    results: list[tuple[str, float]] = []

    for movement in movements:
        level = apply_movement_to_level(level, movement, tank.id)
        results.append((movement.id, round(level, 2)))

    return results
