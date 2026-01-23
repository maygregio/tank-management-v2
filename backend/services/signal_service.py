"""Signal service - business logic for signal operations."""
import logging
from typing import Optional

from models import Movement, MovementType, Tank, SignalAssignment, TradeInfoUpdate
from services.storage import CosmosStorage
from services.excel_parser import parse_signals_excel, ExcelParseResult

logger = logging.getLogger(__name__)


class SignalServiceError(Exception):
    """Custom exception for signal service errors."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class SignalUploadResult(ExcelParseResult):
    """Result from uploading signals."""
    created_count: int = 0
    skipped_count: int = 0


class SignalService:
    """Service class for signal operations."""

    def __init__(self):
        self._movement_storage = CosmosStorage("movements", Movement)
        self._tank_storage = CosmosStorage("tanks", Tank)

    def get_pending_signals(self, skip: int = 0, limit: int = 100) -> list[Movement]:
        """Get signals that need work (unassigned OR missing trade info)."""
        logger.info("Fetching pending signals")

        # Query for signals that need attention
        movements = self._movement_storage.query(
            conditions=["NOT IS_NULL(c.signal_id)"],
            order_by="scheduled_date",
            order_desc=True
        )

        # Filter in Python for complex OR condition
        # (Cosmos DB doesn't handle this well in a single query)
        signals = [
            m for m in movements
            if m.tank_id is None or m.trade_number is None or m.trade_line_item is None
        ]

        # Apply pagination
        return signals[skip:skip + limit] if limit else signals[skip:]

    def upload_signals(self, file_content: bytes) -> SignalUploadResult:
        """Upload signals from Excel file."""
        logger.info("Processing signal upload")

        parse_result = parse_signals_excel(file_content)

        # Get existing signal IDs to avoid duplicates
        existing_movements = self._movement_storage.query(
            conditions=["NOT IS_NULL(c.signal_id)"]
        )
        existing_signal_ids = {m.signal_id for m in existing_movements if m.signal_id}

        created_count = 0
        skipped_count = 0
        for signal in parse_result.signals:
            if signal.signal_id in existing_signal_ids:
                skipped_count += 1
                continue

            movement = Movement(
                type=MovementType.LOAD,
                tank_id_default=None,  # Unassigned signal
                expected_volume_default=signal.volume,
                scheduled_date_default=signal.load_date,
                signal_id=signal.signal_id,
                refinery_tank_name=signal.refinery_tank_name,
                notes_default=f"Signal from refinery tank: {signal.refinery_tank_name}"
            )
            self._movement_storage.create(movement)
            created_count += 1

        logger.info(f"Signal upload complete: created={created_count}, skipped={skipped_count}")
        return SignalUploadResult(
            signals=parse_result.signals,
            errors=parse_result.errors,
            created_count=created_count,
            skipped_count=skipped_count
        )

    def assign_signal(self, movement_id: str, data: SignalAssignment) -> Movement:
        """Assign an unassigned signal to a tank (user values go to _manual fields)."""
        logger.info(f"Assigning signal: {movement_id} to tank {data.tank_id_manual}")

        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            raise SignalServiceError("Movement not found", 404)

        if movement.tank_id is not None:
            raise SignalServiceError("Movement is already assigned to a tank")

        if movement.signal_id is None:
            raise SignalServiceError("Movement is not a signal")

        tank = self._tank_storage.get_by_id(data.tank_id_manual)
        if not tank:
            raise SignalServiceError("Tank not found")

        # All user-provided values go to _manual fields
        update_data = {
            "tank_id_manual": data.tank_id_manual,
            "expected_volume_manual": data.expected_volume_manual,
            "scheduled_date_manual": data.scheduled_date_manual,
        }
        if data.notes_manual is not None:
            update_data["notes_manual"] = data.notes_manual
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

        updated = self._movement_storage.update(movement_id, update_data)
        if not updated:
            raise SignalServiceError("Failed to assign signal", 500)

        logger.info(f"Signal assigned: {movement_id}")
        return updated

    def update_trade_info(self, movement_id: str, data: TradeInfoUpdate) -> Movement:
        """Update trade information on a signal (user values go to _manual fields)."""
        logger.info(f"Updating trade info: {movement_id}")

        movement = self._movement_storage.get_by_id(movement_id)
        if not movement:
            raise SignalServiceError("Movement not found", 404)

        if movement.signal_id is None:
            raise SignalServiceError("Movement is not a signal")

        # Trade info from user goes to _manual fields
        update_data = {
            "trade_number_manual": data.trade_number,
            "trade_line_item_manual": data.trade_line_item,
        }

        updated = self._movement_storage.update(movement_id, update_data)
        if not updated:
            raise SignalServiceError("Failed to update trade info", 500)

        logger.info(f"Trade info updated: {movement_id}")
        return updated


# Singleton instance
_signal_service: SignalService | None = None


def get_signal_service() -> SignalService:
    """Get or create the signal service singleton."""
    global _signal_service
    if _signal_service is None:
        _signal_service = SignalService()
    return _signal_service
