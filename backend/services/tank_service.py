"""Tank service - business logic for tank operations."""
import logging
from datetime import date, timedelta
from typing import Optional

from models import Tank, TankCreate, TankUpdate, TankWithLevel, Movement
from services.storage import CosmosStorage
from services.calculations import get_tank_with_level

logger = logging.getLogger(__name__)


class DailyVolume:
    """Daily volume snapshot for a tank."""
    def __init__(self, day: date, eod_volume: float):
        self.date = day
        self.eod_volume = eod_volume

    def to_dict(self) -> dict:
        return {
            "date": self.date.isoformat(),
            "eod_volume": self.eod_volume
        }


class TankService:
    """Service class for tank operations."""

    def __init__(self):
        self._tank_storage = CosmosStorage("tanks", Tank)
        self._movement_storage = CosmosStorage("movements", Movement)

    def get_all(
        self,
        location: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[TankWithLevel]:
        """Get all tanks with level percentages."""
        logger.info(f"Fetching tanks: location={location}, skip={skip}, limit={limit}")

        if location:
            tanks = self._tank_storage.filter(location=location, skip=skip, limit=limit)
        else:
            tanks = self._tank_storage.get_all(skip=skip, limit=limit)

        # Use stored current_level instead of calculating
        return [get_tank_with_level(tank) for tank in tanks]

    def get_by_id(self, tank_id: str) -> TankWithLevel | None:
        """Get a specific tank with level percentage."""
        logger.info(f"Fetching tank: {tank_id}")
        tank = self._tank_storage.get_by_id(tank_id)
        if not tank:
            return None

        return get_tank_with_level(tank)

    def get_history(
        self,
        tank_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> list[Movement] | None:
        """Get movement history for a specific tank."""
        logger.info(f"Fetching tank history: {tank_id}")
        tank = self._tank_storage.get_by_id(tank_id)
        if not tank:
            return None

        # Query movements for this tank using OR condition
        movements = self._movement_storage.query(
            conditions=["(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)"],
            parameters=[{"name": "@tank_id", "value": tank_id}],
            order_by="created_at",
            order_desc=True,
            skip=skip,
            limit=limit
        )
        return movements

    def get_volume_history(
        self,
        tank_id: str,
        start_date: date,
        end_date: date
    ) -> list[dict] | None:
        """Get daily EOD volume history for a tank.

        Returns a list of {date, eod_volume} for each day in the range.
        """
        logger.info(f"Fetching volume history: tank_id={tank_id}, start={start_date}, end={end_date}")

        tank = self._tank_storage.get_by_id(tank_id)
        if not tank:
            return None

        # Get all movements for this tank in the date range
        movements = self._movement_storage.query(
            conditions=[
                "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                "(c.scheduled_date_default >= @start_date OR c.scheduled_date_manual >= @start_date)",
                "(c.scheduled_date_default <= @end_date OR c.scheduled_date_manual <= @end_date)"
            ],
            parameters=[
                {"name": "@tank_id", "value": tank_id},
                {"name": "@start_date", "value": start_date.isoformat()},
                {"name": "@end_date", "value": end_date.isoformat()}
            ],
            order_by="scheduled_date_default",
            order_desc=False
        )

        # Sort by effective scheduled_date
        movements.sort(key=lambda m: m.scheduled_date or date.min)

        # Group movements by day and find EOD volume
        # We need to track the last resulting_volume for each day
        eod_by_day: dict[date, float] = {}

        for movement in movements:
            movement_date = movement.scheduled_date
            if not movement_date:
                continue

            # For movements where this tank is the source, use resulting_volume
            if movement.tank_id == tank_id and movement.resulting_volume is not None:
                eod_by_day[movement_date] = movement.resulting_volume
            # For movements where this tank is the target (transfers in),
            # use target_resulting_volume
            elif movement.target_tank_id == tank_id and movement.target_resulting_volume is not None:
                eod_by_day[movement_date] = movement.target_resulting_volume

        # Build the result with all days in the range
        result: list[dict] = []
        current_volume = tank.initial_level

        # Get the last movement before start_date to get starting volume
        # Include both source movements and transfer-ins (target_tank_id)
        pre_movements = self._movement_storage.query(
            conditions=[
                "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                "(c.scheduled_date_default < @start_date OR c.scheduled_date_manual < @start_date)"
            ],
            parameters=[
                {"name": "@tank_id", "value": tank_id},
                {"name": "@start_date", "value": start_date.isoformat()}
            ],
            order_by="scheduled_date_default",
            order_desc=True,
            limit=10  # Get more to find the most recent by effective date
        )
        if pre_movements:
            # Sort by effective scheduled_date and find the most recent
            pre_movements.sort(key=lambda m: m.scheduled_date or date.min, reverse=True)
            for pre_mov in pre_movements:
                # For transfer-ins, use target_resulting_volume
                if pre_mov.target_tank_id == tank_id and pre_mov.target_resulting_volume is not None:
                    current_volume = pre_mov.target_resulting_volume
                    break
                # For source movements, use resulting_volume
                elif pre_mov.tank_id == tank_id and pre_mov.resulting_volume is not None:
                    current_volume = pre_mov.resulting_volume
                    break

        # Iterate through each day in the range
        current_date = start_date
        while current_date <= end_date:
            if current_date in eod_by_day:
                current_volume = eod_by_day[current_date]

            result.append({
                "date": current_date.isoformat(),
                "eod_volume": round(current_volume, 2)
            })
            current_date += timedelta(days=1)

        return result

    def create(self, tank_data: TankCreate) -> Tank:
        """Create a new tank."""
        logger.info(f"Creating tank: {tank_data.name}")
        # Set current_level to initial_level when creating
        tank = Tank(
            **tank_data.model_dump(),
            current_level=tank_data.initial_level
        )
        created = self._tank_storage.create(tank)
        logger.info(f"Tank created: {created.id}")
        return created

    def update(self, tank_id: str, tank_data: TankUpdate) -> Tank | None:
        """Update an existing tank."""
        logger.info(f"Updating tank: {tank_id}")
        updated = self._tank_storage.update(tank_id, tank_data.model_dump(exclude_unset=True))
        if updated:
            logger.info(f"Tank updated: {tank_id}")
        return updated

    def delete(self, tank_id: str) -> bool:
        """Delete a tank."""
        logger.info(f"Deleting tank: {tank_id}")
        deleted = self._tank_storage.delete(tank_id)
        if deleted:
            logger.info(f"Tank deleted: {tank_id}")
        return deleted


# Singleton instance
_tank_service: TankService | None = None


def get_tank_service() -> TankService:
    """Get or create the tank service singleton."""
    global _tank_service
    if _tank_service is None:
        _tank_service = TankService()
    return _tank_service
