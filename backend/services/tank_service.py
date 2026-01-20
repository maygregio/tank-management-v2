"""Tank service - business logic for tank operations."""
import logging
from typing import Optional

from models import Tank, TankCreate, TankUpdate, TankWithLevel, Movement
from services.storage import CosmosStorage
from services.calculations import get_tank_with_level

logger = logging.getLogger(__name__)


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
        """Get all tanks with calculated levels."""
        logger.info(f"Fetching tanks: location={location}, skip={skip}, limit={limit}")

        if location:
            tanks = self._tank_storage.filter(location=location, skip=skip, limit=limit)
        else:
            tanks = self._tank_storage.get_all(skip=skip, limit=limit)

        movements = self._movement_storage.get_all()
        return [get_tank_with_level(tank, movements) for tank in tanks]

    def get_by_id(self, tank_id: str) -> TankWithLevel | None:
        """Get a specific tank with calculated level."""
        logger.info(f"Fetching tank: {tank_id}")
        tank = self._tank_storage.get_by_id(tank_id)
        if not tank:
            return None

        movements = self._movement_storage.get_all()
        return get_tank_with_level(tank, movements)

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
            conditions=["(c.tank_id = @tank_id OR c.target_tank_id = @tank_id)"],
            parameters=[{"name": "@tank_id", "value": tank_id}],
            order_by="created_at",
            order_desc=True,
            skip=skip,
            limit=limit
        )
        return movements

    def create(self, tank_data: TankCreate) -> Tank:
        """Create a new tank."""
        logger.info(f"Creating tank: {tank_data.name}")
        tank = Tank(**tank_data.model_dump())
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
