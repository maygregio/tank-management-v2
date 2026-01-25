"""Movement service - business logic for movement operations."""
import logging
from datetime import date, timedelta
from typing import Optional

from models import (
    Movement, MovementCreate, MovementComplete, MovementUpdate, MovementType,
    Tank, AdjustmentCreate, TransferCreate, MovementWithCOA, CertificateOfAnalysis
)
from services.storage import CosmosStorage
from services.calculations import (
    calculate_adjustment, get_volume_delta, apply_movement_to_level
)

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
        self._coa_storage = CosmosStorage("certificates_of_analysis", CertificateOfAnalysis)

    def _get_tank_movements_from_date(
        self,
        tank_id: str,
        from_date: date,
        exclude_movement_id: str | None = None
    ) -> list[Movement]:
        """Get movements for a tank from a certain date forward, sorted by scheduled_date ASC."""
        # Query movements where tank_id or target_tank_id matches
        # Use OR to over-fetch candidates, then filter by effective date in Python
        movements = self._movement_storage.query(
            conditions=[
                "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                "(c.scheduled_date_default >= @from_date OR c.scheduled_date_manual >= @from_date)"
            ],
            parameters=[
                {"name": "@tank_id", "value": tank_id},
                {"name": "@from_date", "value": from_date.isoformat()}
            ],
            order_by="scheduled_date_default",
            order_desc=False
        )

        # Filter out the excluded movement
        if exclude_movement_id:
            movements = [m for m in movements if m.id != exclude_movement_id]

        # Filter by effective scheduled_date (manual overrides default)
        # The OR query over-fetches, so we must filter to only include movements
        # where the effective date is actually >= from_date
        movements = [m for m in movements if m.scheduled_date and m.scheduled_date >= from_date]

        # Sort by effective scheduled_date
        movements.sort(key=lambda m: m.scheduled_date or date.min)

        return movements

    def _get_starting_volume_for_tank(self, tank: Tank, before_date: date) -> float:
        """Get the tank volume just before a certain date.

        Finds the last movement before the date and returns its resulting_volume,
        or falls back to calculating from all movements if no resulting_volume is set.
        """
        # Get movements before this date
        # Use OR to over-fetch candidates, then filter by effective date in Python
        movements = self._movement_storage.query(
            conditions=[
                "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                "(c.scheduled_date_default < @before_date OR c.scheduled_date_manual < @before_date)"
            ],
            parameters=[
                {"name": "@tank_id", "value": tank.id},
                {"name": "@before_date", "value": before_date.isoformat()}
            ],
            order_by="scheduled_date_default",
            order_desc=True,
            limit=100  # Fetch more to find one with resulting_volume or calculate
        )

        # Filter by effective scheduled_date and sort to find the most recent
        movements = [m for m in movements if m.scheduled_date and m.scheduled_date < before_date]
        movements.sort(key=lambda m: m.scheduled_date or date.min, reverse=True)

        if movements:
            # Try to find a movement with resulting_volume set (iterate through all)
            for movement in movements:
                # If this tank is the source, use resulting_volume
                if movement.tank_id == tank.id and movement.resulting_volume is not None:
                    return movement.resulting_volume
                # If this tank is the target of a transfer, use target_resulting_volume
                if movement.target_tank_id == tank.id and movement.target_resulting_volume is not None:
                    return movement.target_resulting_volume

            # No movement has resulting_volume set (pre-migration data)
            # Fall back to calculating from all movements
            from services.calculations import calculate_tank_level
            # Sort chronologically for calculation
            movements.sort(key=lambda m: m.scheduled_date or date.min)
            # Calculate level as of the day before before_date
            as_of = before_date - timedelta(days=1)
            return calculate_tank_level(tank, movements, as_of=as_of)

        return tank.initial_level

    def _get_available_volume_for_movement(
        self,
        tank: Tank,
        scheduled_date: date,
        exclude_movement_id: str | None = None
    ) -> float:
        """Get available volume for a discharge/transfer on a given date.

        Computes the tank level after applying all same-day movements that would
        be processed before a new/updated movement. This ensures validation
        accounts for other movements on the same day.

        Args:
            tank: The source tank
            scheduled_date: The date of the movement being validated
            exclude_movement_id: Movement ID to exclude (for updates)

        Returns:
            Available volume in barrels
        """
        # Start with volume at beginning of the scheduled date
        starting_volume = self._get_starting_volume_for_tank(tank, scheduled_date)

        # Get all movements on this exact date for this tank
        movements = self._movement_storage.query(
            conditions=[
                "(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)",
                "(c.scheduled_date_default = @date OR c.scheduled_date_manual = @date)"
            ],
            parameters=[
                {"name": "@tank_id", "value": tank.id},
                {"name": "@date", "value": scheduled_date.isoformat()}
            ],
            order_by="created_at",
            order_desc=False
        )

        # Filter to only movements with effective date matching scheduled_date
        movements = [m for m in movements if m.scheduled_date == scheduled_date]

        # Exclude the movement being updated (if applicable)
        if exclude_movement_id:
            movements = [m for m in movements if m.id != exclude_movement_id]

        # Apply all same-day movements to get current available volume
        available = starting_volume
        for movement in movements:
            available = apply_movement_to_level(available, movement, tank.id)

        return available

    def _recalculate_tank_volumes(
        self,
        tank: Tank,
        from_date: date,
        exclude_movement_id: str | None = None
    ) -> float:
        """Recalculate resulting_volume for all movements from a date forward.

        Returns the tank level as of today (only movements with scheduled_date <= today
        contribute to current_level).
        """
        today = date.today()

        # Get starting volume
        starting_volume = self._get_starting_volume_for_tank(tank, from_date)

        # Get all movements from this date forward
        movements = self._get_tank_movements_from_date(tank.id, from_date, exclude_movement_id)

        # Recalculate and update each movement
        current_level = starting_volume
        level_as_of_today = starting_volume

        for movement in movements:
            current_level = apply_movement_to_level(current_level, movement, tank.id)

            # Update resulting_volume based on whether this tank is source or target
            if movement.tank_id == tank.id:
                self._movement_storage.update(movement.id, {"resulting_volume": round(current_level, 2)})
            elif movement.target_tank_id == tank.id:
                self._movement_storage.update(movement.id, {"target_resulting_volume": round(current_level, 2)})

            # Track level as of today (only for movements up to today)
            if movement.scheduled_date and movement.scheduled_date <= today:
                level_as_of_today = current_level

        return round(level_as_of_today, 2)

    def _update_tank_current_level(self, tank_id: str, new_level: float) -> None:
        """Update a tank's current_level."""
        self._tank_storage.update(tank_id, {"current_level": round(new_level, 2)})

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
            conditions.append("(c.tank_id_default = @tank_id OR c.tank_id_manual = @tank_id OR c.target_tank_id = @tank_id)")
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
            order_by="scheduled_date_default",
            order_desc=True,
            skip=skip,
            limit=limit
        )
        return movements

    def get_by_id(self, movement_id: str) -> Movement | None:
        """Get a specific movement."""
        return self._movement_storage.get_by_id(movement_id)

    def get_overview(self) -> list[MovementWithCOA]:
        """Get all movements joined with COA chemical properties for overview display."""
        logger.info("Fetching movements overview with COA data")

        # Get all movements (pending and completed)
        movements = self._movement_storage.get_all()

        # Get all COAs for joining
        coas = self._coa_storage.get_all()

        # Build lookup dictionaries for COAs by nomination_key and signal_id
        coa_by_nomination_key: dict[str, CertificateOfAnalysis] = {}
        coa_by_signal_id: dict[str, CertificateOfAnalysis] = {}
        for coa in coas:
            if coa.nomination_key:
                coa_by_nomination_key[coa.nomination_key] = coa
            if coa.signal_id:
                coa_by_signal_id[coa.signal_id] = coa

        # Join movements with COA data
        results: list[MovementWithCOA] = []
        for movement in movements:
            # Find matching COA (prefer nomination_key, fall back to signal_id)
            coa = None
            if movement.nomination_key and movement.nomination_key in coa_by_nomination_key:
                coa = coa_by_nomination_key[movement.nomination_key]
            elif movement.signal_id and movement.signal_id in coa_by_signal_id:
                coa = coa_by_signal_id[movement.signal_id]

            # Create MovementWithCOA with COA properties
            movement_dict = movement.model_dump()
            movement_with_coa = MovementWithCOA(
                **movement_dict,
                coa_api_gravity=coa.api_gravity if coa else None,
                coa_sulfur_content=coa.sulfur_content if coa else None,
                coa_viscosity=coa.viscosity if coa else None,
                coa_ash_content=coa.ash_content if coa else None
            )
            results.append(movement_with_coa)

        logger.info(f"Returning {len(results)} movements with COA data")
        return results

    def create(self, movement_data: MovementCreate) -> Movement:
        """Create a new scheduled movement."""
        logger.info(f"Creating movement: type={movement_data.type}, tank_id={movement_data.tank_id}")

        # Validate tank exists
        tank = self._tank_storage.get_by_id(movement_data.tank_id)
        if not tank:
            raise MovementServiceError("Tank not found")

        target_tank: Tank | None = None

        # Validate transfer target tank
        if movement_data.type == MovementType.TRANSFER:
            if not movement_data.target_tank_id:
                raise MovementServiceError("Target tank is required for transfers")
            target_tank = self._tank_storage.get_by_id(movement_data.target_tank_id)
            if not target_tank:
                raise MovementServiceError("Target tank not found")
            if movement_data.tank_id == movement_data.target_tank_id:
                raise MovementServiceError("Source and target tank cannot be the same")

        today = date.today()
        is_future_movement = movement_data.scheduled_date > today

        # For discharge/transfer, verify sufficient feedstock as of the scheduled date
        # This accounts for other same-day movements that would be processed first
        if movement_data.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
            available_level = self._get_available_volume_for_movement(
                tank, movement_data.scheduled_date
            )
            if movement_data.expected_volume > available_level:
                raise MovementServiceError(
                    f"Insufficient feedstock. Available level: {available_level:.2f} bbl"
                )

        # Calculate resulting_volume for source tank
        delta = get_volume_delta(
            Movement(
                type=movement_data.type,
                tank_id_default=movement_data.tank_id,
                target_tank_id=movement_data.target_tank_id,
                expected_volume_default=movement_data.expected_volume
            ),
            movement_data.tank_id
        )
        new_source_level = max(0, round(tank.current_level + delta, 2))

        # Calculate target_resulting_volume for transfers
        new_target_level: float | None = None
        if target_tank:
            new_target_level = round(target_tank.current_level + movement_data.expected_volume, 2)

        movement = Movement(
            type=movement_data.type,
            tank_id_default=movement_data.tank_id,
            target_tank_id=movement_data.target_tank_id,
            expected_volume_default=movement_data.expected_volume,
            actual_volume=None,
            scheduled_date_default=movement_data.scheduled_date,
            notes_default=movement_data.notes,
            resulting_volume=new_source_level,
            target_resulting_volume=new_target_level
        )
        created = self._movement_storage.create(movement)

        # Recalculate from the scheduled date to handle insertions and ensure
        # resulting_volume reflects any earlier movements on that date.
        new_level = self._recalculate_tank_volumes(tank, movement_data.scheduled_date)
        if not is_future_movement:
            self._update_tank_current_level(tank.id, new_level)

        # For transfers, also recalculate target tank
        if target_tank:
            new_target_level = self._recalculate_tank_volumes(target_tank, movement_data.scheduled_date)
            if not is_future_movement:
                self._update_tank_current_level(target_tank.id, new_target_level)

        # Refetch to get updated resulting_volume
        created = self._movement_storage.get_by_id(created.id)

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

        today = date.today()
        is_future_movement = transfer_data.scheduled_date > today

        # Verify sufficient feedstock
        # Use level as of scheduled_date for historical movements, current_level for future
        total_volume = sum(target.volume for target in transfer_data.targets)
        if not is_future_movement:
            available_level = self._get_starting_volume_for_tank(source_tank, transfer_data.scheduled_date)
        else:
            available_level = source_tank.current_level
        if total_volume > available_level:
            raise MovementServiceError(
                f"Insufficient feedstock. Available level: {available_level:.2f} bbl"
            )

        created_movements: list[Movement] = []
        running_source_level = source_tank.current_level

        for target in transfer_data.targets:
            target_tank = self._tank_storage.get_by_id(target.tank_id)
            if not target_tank:
                raise MovementServiceError(f"Target tank not found: {target.tank_id}")

            # Calculate new source level after this transfer
            running_source_level = max(0, round(running_source_level - target.volume, 2))

            # Calculate target tank's new level
            new_target_level = round(target_tank.current_level + target.volume, 2)

            movement = Movement(
                type=MovementType.TRANSFER,
                tank_id_default=transfer_data.source_tank_id,
                target_tank_id=target.tank_id,
                expected_volume_default=target.volume,
                actual_volume=None,
                scheduled_date_default=transfer_data.scheduled_date,
                notes_default=transfer_data.notes,
                resulting_volume=running_source_level,
                target_resulting_volume=new_target_level
            )
            created = self._movement_storage.create(movement)
            created_movements.append(created)

        # Recalculate from the scheduled date to handle insertions and ensure
        # resulting_volume reflects any earlier movements on that date.
        new_source_level = self._recalculate_tank_volumes(source_tank, transfer_data.scheduled_date)
        if not is_future_movement:
            self._update_tank_current_level(source_tank.id, new_source_level)

        # Recalculate each target tank
        target_tank_ids = set(target.tank_id for target in transfer_data.targets)
        for target_id in target_tank_ids:
            target_tank = self._tank_storage.get_by_id(target_id)
            if target_tank:
                new_level = self._recalculate_tank_volumes(target_tank, transfer_data.scheduled_date)
                if not is_future_movement:
                    self._update_tank_current_level(target_id, new_level)

        # Refetch all movements to get updated resulting_volumes
        created_movements = [
            self._movement_storage.get_by_id(m.id) for m in created_movements
        ]

        logger.info(f"Created {len(created_movements)} transfer movements")
        return created_movements

    def update(self, movement_id: str, data: MovementUpdate) -> Movement:
        """Update a pending movement (user values go to _manual fields)."""
        logger.info(f"Updating movement: {movement_id}")

        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            raise MovementServiceError("Movement not found", 404)

        if movement.actual_volume is not None:
            raise MovementServiceError("Cannot edit completed movements")

        # Track if volume, tank, or scheduled_date changed for recalculation
        old_volume = movement.expected_volume or 0
        old_scheduled_date = movement.scheduled_date
        volume_changed = False
        tank_changed = False
        scheduled_date_changed = False
        old_tank_id = movement.tank_id

        update_data = {}
        if data.scheduled_date_manual is not None:
            scheduled_date_changed = (data.scheduled_date_manual != old_scheduled_date)
            update_data["scheduled_date_manual"] = data.scheduled_date_manual
        if data.expected_volume_manual is not None:
            volume_changed = (data.expected_volume_manual != old_volume)
            # Validate sufficient feedstock for discharge/transfer
            if movement.type in [MovementType.DISCHARGE, MovementType.TRANSFER]:
                # Use effective values (considering potential updates in this request)
                effective_tank_id = data.tank_id_manual if data.tank_id_manual is not None else movement.tank_id
                effective_date = data.scheduled_date_manual if data.scheduled_date_manual is not None else movement.scheduled_date
                tank = self._tank_storage.get_by_id(effective_tank_id)
                if not tank:
                    raise MovementServiceError("Tank not found")
                # Compute available volume as of the scheduled date, excluding this movement
                available = self._get_available_volume_for_movement(
                    tank, effective_date, exclude_movement_id=movement.id
                )
                if data.expected_volume_manual > available:
                    raise MovementServiceError(
                        f"Insufficient feedstock. Available: {available:.2f} bbl"
                    )
            update_data["expected_volume_manual"] = data.expected_volume_manual
        if data.notes_manual is not None:
            update_data["notes_manual"] = data.notes_manual
        if data.tank_id_manual is not None:
            tank_changed = (data.tank_id_manual != old_tank_id)
            update_data["tank_id_manual"] = data.tank_id_manual
        if data.trade_number_manual is not None:
            update_data["trade_number_manual"] = data.trade_number_manual
        if data.trade_line_item_manual is not None:
            update_data["trade_line_item_manual"] = data.trade_line_item_manual
        if data.strategy_manual is not None:
            update_data["strategy_manual"] = data.strategy_manual
        if data.destination_manual is not None:
            update_data["destination_manual"] = data.destination_manual
        if data.equipment_manual is not None:
            update_data["equipment_manual"] = data.equipment_manual
        if data.discharge_date_manual is not None:
            update_data["discharge_date_manual"] = data.discharge_date_manual
        if data.base_diff_manual is not None:
            update_data["base_diff_manual"] = data.base_diff_manual
        if data.quality_adj_diff_manual is not None:
            update_data["quality_adj_diff_manual"] = data.quality_adj_diff_manual

        if not update_data:
            return movement

        updated = self._movement_storage.update(movement_id, update_data)
        if not updated:
            raise MovementServiceError("Failed to update movement", 500)

        # Recalculate volumes if volume, tank, or scheduled_date changed
        if volume_changed or tank_changed or scheduled_date_changed:
            # Determine the recalculation start date
            # For scheduled_date changes, use the earlier of old and new dates
            new_scheduled_date = updated.scheduled_date
            if scheduled_date_changed and old_scheduled_date and new_scheduled_date:
                recalc_from_date = min(old_scheduled_date, new_scheduled_date)
            else:
                recalc_from_date = new_scheduled_date

            # Recalculate for the affected tank(s)
            if updated.tank_id:
                tank = self._tank_storage.get_by_id(updated.tank_id)
                if tank and recalc_from_date:
                    new_level = self._recalculate_tank_volumes(tank, recalc_from_date)
                    self._update_tank_current_level(tank.id, new_level)

            # For transfers, also recalculate target tank
            if updated.type == MovementType.TRANSFER and updated.target_tank_id:
                target_tank = self._tank_storage.get_by_id(updated.target_tank_id)
                if target_tank and recalc_from_date:
                    new_level = self._recalculate_tank_volumes(target_tank, recalc_from_date)
                    self._update_tank_current_level(target_tank.id, new_level)

            # If tank changed, also recalculate the old tank
            if tank_changed and old_tank_id:
                old_tank = self._tank_storage.get_by_id(old_tank_id)
                if old_tank and recalc_from_date:
                    new_level = self._recalculate_tank_volumes(old_tank, recalc_from_date)
                    self._update_tank_current_level(old_tank.id, new_level)

            # Refetch the updated movement to get the new resulting_volume
            updated = self._movement_storage.get_by_id(movement_id)

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

        # Recalculate from this movement forward since actual may differ from expected
        if movement.tank_id and movement.scheduled_date:
            tank = self._tank_storage.get_by_id(movement.tank_id)
            if tank:
                new_level = self._recalculate_tank_volumes(tank, movement.scheduled_date)
                self._update_tank_current_level(tank.id, new_level)

        # For transfers, also recalculate target tank
        if movement.type == MovementType.TRANSFER and movement.target_tank_id and movement.scheduled_date:
            target_tank = self._tank_storage.get_by_id(movement.target_tank_id)
            if target_tank:
                new_level = self._recalculate_tank_volumes(target_tank, movement.scheduled_date)
                self._update_tank_current_level(target_tank.id, new_level)

        # Refetch to get updated resulting_volume
        updated = self._movement_storage.get_by_id(movement_id)

        logger.info(f"Movement completed: {movement_id}, actual_volume={data.actual_volume}")
        return updated

    def create_adjustment(self, adjustment_data: AdjustmentCreate) -> Movement:
        """Create an adjustment movement based on physical reading."""
        return self.create_imported_adjustment(
            tank_id=adjustment_data.tank_id,
            physical_level=adjustment_data.physical_level,
            inspection_date=date.today(),
            notes=adjustment_data.notes,
            pdf_url=None
        )

    def create_imported_adjustment(
        self,
        tank_id: str,
        physical_level: float,
        inspection_date: date,
        notes: str | None,
        pdf_url: str | None
    ) -> Movement:
        """Create an adjustment movement from an import with a specific inspection date."""
        logger.info(f"Creating adjustment for tank: {tank_id}")

        tank = self._tank_storage.get_by_id(tank_id)
        if not tank:
            raise MovementServiceError("Tank not found")

        if physical_level > tank.capacity:
            raise MovementServiceError(
                f"Physical level cannot exceed tank capacity ({tank.capacity} bbl)"
            )

        # Use the system level as of the inspection date.
        system_level = self._get_starting_volume_for_tank(tank, inspection_date + timedelta(days=1))
        adjustment_quantity = calculate_adjustment(system_level, physical_level)

        resolved_notes = notes or (
            f"Physical reading adjustment. Previous: {system_level:.2f} bbl, Physical: {physical_level:.2f} bbl"
        )
        if adjustment_quantity < 0:
            resolved_notes = f"(Loss) {resolved_notes}"
        else:
            resolved_notes = f"(Gain) {resolved_notes}"

        movement = Movement(
            type=MovementType.ADJUSTMENT,
            tank_id_default=tank_id,
            expected_volume_default=abs(adjustment_quantity),
            actual_volume=adjustment_quantity,
            scheduled_date_default=inspection_date,
            notes_default=resolved_notes,
            pdf_url=pdf_url
        )

        created = self._movement_storage.create(movement)

        # Recalculate from the inspection date to refresh resulting volumes.
        new_level = self._recalculate_tank_volumes(tank, inspection_date)
        if inspection_date <= date.today():
            self._update_tank_current_level(tank.id, new_level)

        created = self._movement_storage.get_by_id(created.id)
        logger.info(f"Adjustment created: {created.id}, quantity={adjustment_quantity}")
        return created

    def create_completed(self, movement_data: MovementCreate, actual_volume: float) -> Movement:
        """Create a movement and immediately mark it completed."""
        created = self.create(movement_data)
        completed = self.complete(created.id, MovementComplete(actual_volume=actual_volume))
        return completed

    def delete(self, movement_id: str) -> bool:
        """Delete a movement and recalculate affected tank volumes."""
        logger.info(f"Deleting movement: {movement_id}")

        # Get movement details before deleting
        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            return False

        # Store info needed for recalculation
        tank_id = movement.tank_id
        target_tank_id = movement.target_tank_id
        scheduled_date = movement.scheduled_date
        movement_type = movement.type

        # Delete the movement
        deleted = self._movement_storage.delete(movement_id)
        if not deleted:
            return False

        # Recalculate affected tanks from the movement's date
        if tank_id and scheduled_date:
            tank = self._tank_storage.get_by_id(tank_id)
            if tank:
                new_level = self._recalculate_tank_volumes(tank, scheduled_date)
                self._update_tank_current_level(tank.id, new_level)

        # For transfers, also recalculate target tank
        if movement_type == MovementType.TRANSFER and target_tank_id and scheduled_date:
            target_tank = self._tank_storage.get_by_id(target_tank_id)
            if target_tank:
                new_level = self._recalculate_tank_volumes(target_tank, scheduled_date)
                self._update_tank_current_level(target_tank.id, new_level)

        logger.info(f"Movement deleted: {movement_id}")
        return True


# Singleton instance
_movement_service: MovementService | None = None


def get_movement_service() -> MovementService:
    """Get or create the movement service singleton."""
    global _movement_service
    if _movement_service is None:
        _movement_service = MovementService()
    return _movement_service
