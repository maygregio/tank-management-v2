"""Shared helpers for movement queries and effective date filtering."""
from __future__ import annotations

from datetime import date

from models import Movement

TANK_MATCH_CONDITION = (
    "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)"
)


def build_date_range_conditions(
    start_date: date | None,
    end_date: date | None
) -> tuple[list[str], list[dict[str, str]]]:
    """Build query conditions/parameters for a scheduled_date range."""
    conditions: list[str] = []
    parameters: list[dict[str, str]] = []

    if start_date is not None:
        conditions.append(
            "(c.scheduled_date_default >= @start_date OR c.scheduled_date_manual >= @start_date)"
        )
        parameters.append({"name": "@start_date", "value": start_date.isoformat()})

    if end_date is not None:
        conditions.append(
            "(c.scheduled_date_default <= @end_date OR c.scheduled_date_manual <= @end_date)"
        )
        parameters.append({"name": "@end_date", "value": end_date.isoformat()})

    return conditions, parameters


def build_tank_date_range_conditions(
    tank_id: str,
    start_date: date | None = None,
    end_date: date | None = None
) -> tuple[list[str], list[dict[str, str]]]:
    """Build query conditions/parameters for tank + scheduled_date range."""
    conditions = [TANK_MATCH_CONDITION]
    parameters = [{"name": "@tank_id", "value": tank_id}]

    date_conditions, date_parameters = build_date_range_conditions(start_date, end_date)
    conditions.extend(date_conditions)
    parameters.extend(date_parameters)

    return conditions, parameters


def filter_movements_by_effective_date(
    movements: list[Movement],
    start_date: date | None = None,
    end_date: date | None = None,
    tank_ids: set[str] | None = None
) -> list[Movement]:
    """Filter movements by effective scheduled_date and optional tank IDs."""
    filtered: list[Movement] = []

    for movement in movements:
        effective_date = movement.scheduled_date
        if not effective_date:
            continue
        if start_date and effective_date < start_date:
            continue
        if end_date and effective_date > end_date:
            continue
        if tank_ids and movement.tank_id not in tank_ids and movement.target_tank_id not in tank_ids:
            continue
        filtered.append(movement)

    return filtered
