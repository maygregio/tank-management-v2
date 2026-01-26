"""Terminal service - business logic for terminal aggregation operations."""
import logging
from datetime import date, timedelta
from typing import Optional

from models import Tank, Movement, MovementType
from models.terminals import TerminalSummary, TerminalDailyAggregation
from services.storage import CosmosStorage

logger = logging.getLogger(__name__)


class TerminalService:
    """Service class for terminal aggregation operations."""

    def __init__(self):
        self._tank_storage = CosmosStorage("tanks", Tank)
        self._movement_storage = CosmosStorage("movements", Movement)

    def get_unique_locations(self) -> list[str]:
        """Get list of unique terminal locations."""
        logger.info("Fetching unique terminal locations")
        tanks = self._tank_storage.get_all()
        locations = sorted(set(tank.location for tank in tanks if tank.location))
        logger.info(f"Found {len(locations)} unique locations")
        return locations

    def get_terminal_summaries(self) -> list[TerminalSummary]:
        """Get summary information for all terminals."""
        logger.info("Fetching terminal summaries")
        tanks = self._tank_storage.get_all()

        # Group tanks by location
        tanks_by_location: dict[str, list[Tank]] = {}
        for tank in tanks:
            if tank.location:
                if tank.location not in tanks_by_location:
                    tanks_by_location[tank.location] = []
                tanks_by_location[tank.location].append(tank)

        # Build summaries
        summaries: list[TerminalSummary] = []
        for location, location_tanks in sorted(tanks_by_location.items()):
            total_capacity = sum(t.capacity for t in location_tanks)
            current_total_level = sum(t.current_level for t in location_tanks)
            utilization = (current_total_level / total_capacity * 100) if total_capacity > 0 else 0
            # Clamp utilization to 100% max (tanks can exceed capacity)
            utilization = min(utilization, 100.0)

            summaries.append(TerminalSummary(
                location=location,
                tank_count=len(location_tanks),
                total_capacity=round(total_capacity, 2),
                current_total_level=round(current_total_level, 2),
                utilization_percentage=round(utilization, 2)
            ))

        logger.info(f"Generated {len(summaries)} terminal summaries")
        return summaries

    def get_aggregated_history(
        self,
        location: str,
        start_date: date,
        end_date: date
    ) -> list[TerminalDailyAggregation]:
        """Get daily aggregated data for a terminal location.

        For each day in the range:
        - total_level: Sum of all tank levels at EOD
        - net_movement: Net volume change (loads + transfers_in - discharges - transfers_out + adjustments)
        """
        logger.info(f"Fetching aggregated history: location={location}, start={start_date}, end={end_date}")

        # Get all tanks at this location
        tanks = self._tank_storage.filter(location=location)
        if not tanks:
            logger.warning(f"No tanks found for location: {location}")
            return []

        tank_ids = {tank.id for tank in tanks}
        total_capacity = sum(tank.capacity for tank in tanks)

        # Get all movements in the date range that involve these tanks
        # We need to over-fetch and filter by effective dates in Python
        movements = self._movement_storage.query(
            conditions=[
                "(c.scheduled_date_default >= @start_date OR c.scheduled_date_manual >= @start_date)",
                "(c.scheduled_date_default <= @end_date OR c.scheduled_date_manual <= @end_date)"
            ],
            parameters=[
                {"name": "@start_date", "value": start_date.isoformat()},
                {"name": "@end_date", "value": end_date.isoformat()}
            ]
        )

        # Filter to movements that involve our tanks and are in date range
        relevant_movements = [
            m for m in movements
            if m.scheduled_date and start_date <= m.scheduled_date <= end_date
            and (m.tank_id in tank_ids or m.target_tank_id in tank_ids)
        ]

        # Group movements by day
        movements_by_day: dict[date, list[Movement]] = {}
        for m in relevant_movements:
            if m.scheduled_date:
                if m.scheduled_date not in movements_by_day:
                    movements_by_day[m.scheduled_date] = []
                movements_by_day[m.scheduled_date].append(m)

        # Calculate starting level for the terminal (sum of all tank levels before start_date)
        starting_total_level = self._get_terminal_level_at_date(tanks, tank_ids, start_date - timedelta(days=1))

        # Build daily aggregations
        result: list[TerminalDailyAggregation] = []
        current_total_level = starting_total_level
        current_date = start_date

        while current_date <= end_date:
            day_movements = movements_by_day.get(current_date, [])

            # Calculate movement volumes for the day
            loads_volume = 0.0
            discharges_volume = 0.0
            transfers_in_volume = 0.0
            transfers_out_volume = 0.0
            adjustments_volume = 0.0

            for m in day_movements:
                volume = m.actual_volume if m.actual_volume is not None else (m.expected_volume or 0)

                if m.type == MovementType.LOAD and m.tank_id in tank_ids:
                    loads_volume += volume
                elif m.type == MovementType.DISCHARGE and m.tank_id in tank_ids:
                    discharges_volume += volume
                elif m.type == MovementType.TRANSFER:
                    # Transfer out from this terminal
                    if m.tank_id in tank_ids:
                        transfers_out_volume += volume
                    # Transfer in to this terminal
                    if m.target_tank_id in tank_ids:
                        transfers_in_volume += volume
                elif m.type == MovementType.ADJUSTMENT and m.tank_id in tank_ids:
                    # Adjustments can be positive or negative
                    adjustments_volume += volume

            # Calculate net movement for the day
            net_movement = loads_volume + transfers_in_volume - discharges_volume - transfers_out_volume + adjustments_volume

            # Update running total level
            current_total_level += net_movement

            # Ensure level doesn't go below 0
            current_total_level = max(0, current_total_level)

            # Calculate utilization (clamped to 100% max as tanks can exceed capacity)
            utilization = (current_total_level / total_capacity * 100) if total_capacity > 0 else 0
            utilization = min(utilization, 100.0)

            result.append(TerminalDailyAggregation(
                record_date=current_date,
                total_level=round(current_total_level, 2),
                total_capacity=round(total_capacity, 2),
                net_movement=round(net_movement, 2),
                loads_volume=round(loads_volume, 2),
                discharges_volume=round(discharges_volume, 2),
                transfers_in_volume=round(transfers_in_volume, 2),
                transfers_out_volume=round(transfers_out_volume, 2),
                adjustments_volume=round(adjustments_volume, 2),
                utilization_percentage=round(utilization, 2)
            ))

            current_date += timedelta(days=1)

        logger.info(f"Generated {len(result)} daily aggregations for location: {location}")
        return result

    def _get_terminal_level_at_date(
        self,
        tanks: list[Tank],
        tank_ids: set[str],
        target_date: date
    ) -> float:
        """Get the combined level of all tanks at a specific date.

        Uses resulting_volume from movements to determine tank levels at EOD.
        """
        total_level = 0.0

        for tank in tanks:
            # Get the last movement for this tank on or before the target date
            # Query without limit to ensure we find the latest effective movement
            # even if many movements have been manually rescheduled
            movements = self._movement_storage.query(
                conditions=[
                    "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                    "(c.scheduled_date_default <= @target_date OR c.scheduled_date_manual <= @target_date)"
                ],
                parameters=[
                    {"name": "@tank_id", "value": tank.id},
                    {"name": "@target_date", "value": target_date.isoformat()}
                ],
                order_by="scheduled_date_default",
                order_desc=True
            )

            # Filter by effective date and find the most recent
            movements = [m for m in movements if m.scheduled_date and m.scheduled_date <= target_date]
            movements.sort(key=lambda m: (m.scheduled_date or date.min, m.created_at), reverse=True)

            tank_level = tank.initial_level  # Default to initial level

            for m in movements:
                # For transfer-ins, use target_resulting_volume
                if m.target_tank_id == tank.id and m.target_resulting_volume is not None:
                    tank_level = m.target_resulting_volume
                    break
                # For source movements, use resulting_volume
                elif m.tank_id == tank.id and m.resulting_volume is not None:
                    tank_level = m.resulting_volume
                    break

            total_level += tank_level

        return total_level


# Singleton instance
_terminal_service: TerminalService | None = None


def get_terminal_service() -> TerminalService:
    """Get or create the terminal service singleton."""
    global _terminal_service
    if _terminal_service is None:
        _terminal_service = TerminalService()
    return _terminal_service
