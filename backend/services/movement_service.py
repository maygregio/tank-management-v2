"""Movement service - business logic for movement operations."""
import logging
from datetime import date
from typing import Optional

from models import (
    Movement, MovementCreate, MovementComplete, MovementUpdate, MovementType,
    Tank, AdjustmentCreate, TransferCreate
)
from services.storage import CosmosStorage
from services.calculations import calculate_tank_level, calculate_adjustment

logger = logging.getLogger(__name__)


class MovementServiceError(Exception):
    """Custom exception for movement service errors."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class MovementService:
    """Service class for movement operations."""

    def __init__(self):
        self._movement_storage = CosmosStorage("movements", Movement)
        self._tank_storage = CosmosStorage("tanks", Tank)

    def get_all(
        self,
        tank_id: Optional[str] = None,
        movement_type: Optional[MovementType] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[Movement]:
        """Get movements with optional filters."""
        logger.info(f"Fetching movements: tank_id={tank_id}, type={movement_type}, status={status}")

        conditions = []
        parameters = []

        if tank_id:
            conditions.append("(c.tank_id = @tank_id OR c.target_tank_id = @tank_id)")
            parameters.append({"name": "@tank_id", "value": tank_id})

        if movement_type:
            conditions.append("c.type = @type")
            parameters.append({"name": "@type", "value": movement_type.value})

        if status == "pending":
            conditions.append("IS_NULL(c.actual_volume)")
        elif status == "completed":
            conditions.append("NOT IS_NULL(c.actual_volume)")

        movements = self._movement_storage.query(
            conditions=conditions,
            parameters=parameters if parameters else None,
            order_by="scheduled_date",
            order_desc=True,
            skip=skip,
            limit=limit
        )
        return movements

    def get_by_id(self, movement_id: str) -> Movement | None:
        """Get a specific movement."""
        return self._movement_storage.get_by_id(movement_id)

    def create(self, movement_data: MovementCreate) -> Movement:
        """Create a new scheduled movement."""
        logger.info(f"Creating movement: type={movement_data.type}, tank_id={movement_data.tank_id}")

        # Validate tank exists
        tank = self._tank_storage.get_by_id(movement_data.tank_id)
        if not tank:
            raise MovementServiceError("Tank not found")

        # Validate transfer target tank
        if movement_data.type == MovementType.TRANSFER:
            if not movement_data.target_tank_id:
                raise MovementServiceError("Target tank is required for transfers")
            target_tank = self._tank_storage.get_by_id(movement_data.target_tank_id)
            if not target_tank:
                raise MovementServiceError("Target tank not found")
            if movement_data.tank_id == movement_data.target_tank_id:
                raise MovementServiceError("Source and target tank cannot be the same")

        # For discharge/transfer, verify sufficient fuel
        if movement_data.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
            movements = self._movement_storage.get_all()
            current_level = calculate_tank_level(tank, movements)
            if movement_data.expected_volume > current_level:
                raise MovementServiceError(
                    f"Insufficient feedstock. Current level: {current_level:.2f} bbl"
                )

        movement = Movement(
            type=movement_data.type,
            tank_id=movement_data.tank_id,
            target_tank_id=movement_data.target_tank_id,
            expected_volume=movement_data.expected_volume,
            actual_volume=None,
            scheduled_date=movement_data.scheduled_date,
            notes=movement_data.notes
        )
        created = self._movement_storage.create(movement)
        logger.info(f"Movement created: {created.id}")
        return created

    def create_transfer(self, transfer_data: TransferCreate) -> list[Movement]:
        """Create a transfer from one source tank to multiple targets."""
        logger.info(f"Creating transfer from {transfer_data.source_tank_id} to {len(transfer_data.targets)} targets")

        source_tank = self._tank_storage.get_by_id(transfer_data.source_tank_id)
        if not source_tank:
            raise MovementServiceError("Source tank not found")

        if not transfer_data.targets:
            raise MovementServiceError("At least one target is required")

        target_ids = [target.tank_id for target in transfer_data.targets]
        if transfer_data.source_tank_id in target_ids:
            raise MovementServiceError("Source and target tank cannot be the same")

        total_volume = sum(target.volume for target in transfer_data.targets)
        movements = self._movement_storage.get_all()
        current_level = calculate_tank_level(source_tank, movements)
        if total_volume > current_level:
            raise MovementServiceError(
                f"Insufficient feedstock. Current level: {current_level:.2f} bbl"
            )

        created_movements: list[Movement] = []
        for target in transfer_data.targets:
            target_tank = self._tank_storage.get_by_id(target.tank_id)
            if not target_tank:
                raise MovementServiceError(f"Target tank not found: {target.tank_id}")

            movement = Movement(
                type=MovementType.TRANSFER,
                tank_id=transfer_data.source_tank_id,
                target_tank_id=target.tank_id,
                expected_volume=target.volume,
                actual_volume=None,
                scheduled_date=transfer_data.scheduled_date,
                notes=transfer_data.notes,
            )
            created_movements.append(self._movement_storage.create(movement))

        logger.info(f"Created {len(created_movements)} transfer movements")
        return created_movements

    def update(self, movement_id: str, data: MovementUpdate) -> Movement:
        """Update a pending movement."""
        logger.info(f"Updating movement: {movement_id}")

        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            raise MovementServiceError("Movement not found", 404)

        if movement.actual_volume is not None:
            raise MovementServiceError("Cannot edit completed movements")

        update_data = {}
        if data.scheduled_date is not None:
            update_data["scheduled_date"] = data.scheduled_date
        if data.expected_volume is not None:
            # Validate sufficient fuel for discharge/transfer
            if movement.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
                tank = self._tank_storage.get_by_id(movement.tank_id)
                if not tank:
                    raise MovementServiceError("Tank not found")
                movements = self._movement_storage.get_all()
                current_level = calculate_tank_level(tank, movements)
                available = current_level + movement.expected_volume
                if data.expected_volume > available:
                    raise MovementServiceError(
                        f"Insufficient feedstock. Available: {available:.2f} bbl"
                    )
            update_data["expected_volume"] = data.expected_volume
        if data.notes is not None:
            update_data["notes"] = data.notes

        if not update_data:
            return movement

        updated = self._movement_storage.update(movement_id, update_data)
        if not updated:
            raise MovementServiceError("Failed to update movement", 500)

        logger.info(f"Movement updated: {movement_id}")
        return updated

    def complete(self, movement_id: str, data: MovementComplete) -> Movement:
        """Record actual volume for a scheduled movement."""
        logger.info(f"Completing movement: {movement_id}")

        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            raise MovementServiceError("Movement not found", 404)

        if movement.actual_volume is not None:
            raise MovementServiceError("Movement already completed")

        updated = self._movement_storage.update(movement_id, {"actual_volume": data.actual_volume})
        if not updated:
            raise MovementServiceError("Failed to update movement", 500)

        logger.info(f"Movement completed: {movement_id}, actual_volume={data.actual_volume}")
        return updated

    def create_adjustment(self, adjustment_data: AdjustmentCreate) -> Movement:
        """Create an adjustment movement based on physical reading."""
        logger.info(f"Creating adjustment for tank: {adjustment_data.tank_id}")

        tank = self._tank_storage.get_by_id(adjustment_data.tank_id)
        if not tank:
            raise MovementServiceError("Tank not found")

        if adjustment_data.physical_level > tank.capacity:
            raise MovementServiceError(
                f"Physical level cannot exceed tank capacity ({tank.capacity} bbl)"
            )

        movements = self._movement_storage.get_all()
        current_level = calculate_tank_level(tank, movements)
        adjustment_quantity = calculate_adjustment(current_level, adjustment_data.physical_level)

        notes = adjustment_data.notes or f"Physical reading adjustment. Previous: {current_level:.2f} bbl, Physical: {adjustment_data.physical_level:.2f} bbl"
        if adjustment_quantity < 0:
            notes = f"(Loss) {notes}"
        else:
            notes = f"(Gain) {notes}"

        movement = Movement(
            type=MovementType.ADJUSTMENT,
            tank_id=adjustment_data.tank_id,
            expected_volume=abs(adjustment_quantity),
            actual_volume=adjustment_quantity,
            scheduled_date=date.today(),
            notes=notes
        )

        created = self._movement_storage.create(movement)
        logger.info(f"Adjustment created: {created.id}, quantity={adjustment_quantity}")
        return created

    def delete(self, movement_id: str) -> bool:
        """Delete a movement."""
        logger.info(f"Deleting movement: {movement_id}")
        deleted = self._movement_storage.delete(movement_id)
        if deleted:
            logger.info(f"Movement deleted: {movement_id}")
        return deleted


# Singleton instance
_movement_service: MovementService | None = None


def get_movement_service() -> MovementService:
    """Get or create the movement service singleton."""
    global _movement_service
    if _movement_service is None:
        _movement_service = MovementService()
    return _movement_service
