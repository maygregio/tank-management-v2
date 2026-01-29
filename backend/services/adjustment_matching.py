"""Adjustment tank matching and delta calculation service."""
from models.adjustments import (
    AdjustmentExtractedReading,
    AdjustmentMatchSuggestion,
    AdjustmentReadingWithMatches
)
from models import Tank, TankWithLevel
from services.fuzzy_matching import build_tank_match_suggestions


def find_adjustment_tank_matches(
    extracted_name: str,
    tanks: list[Tank]
) -> tuple[list[AdjustmentMatchSuggestion], bool]:
    """Find tanks that match the extracted name using fuzzy matching."""
    return build_tank_match_suggestions(
        extracted_name,
        tanks,
        lambda tank, score: AdjustmentMatchSuggestion(
            tank_id=tank.id,
            tank_name=tank.name,
            confidence=score
        )
    )


def process_extracted_adjustments(
    extracted: list[AdjustmentExtractedReading],
    tanks: list[Tank],
    tanks_with_levels: list[TankWithLevel]
) -> list[AdjustmentReadingWithMatches]:
    """Process extracted adjustments, find tank matches, and calculate deltas."""
    # Create a lookup map for tank levels
    tank_levels = {t.id: t.current_level for t in tanks_with_levels}

    results = []

    for reading in extracted:
        suggestions, is_exact = find_adjustment_tank_matches(reading.tank_name, tanks)
        best_match = suggestions[0] if suggestions else None

        # Calculate system level and delta if we have a best match
        system_level = None
        delta = None
        if best_match:
            system_level = tank_levels.get(best_match.tank_id)
            if system_level is not None:
                delta = reading.physical_level - system_level

        results.append(AdjustmentReadingWithMatches(
            extracted=reading,
            suggested_matches=suggestions,
            best_match=best_match,
            is_exact_match=is_exact,
            system_level=system_level,
            delta=delta
        ))

    return results
