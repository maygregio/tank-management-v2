"""Adjustment tank matching and delta calculation service."""
from rapidfuzz import fuzz, process
from models.adjustments import (
    AdjustmentExtractedReading,
    AdjustmentMatchSuggestion,
    AdjustmentReadingWithMatches
)
from models import Tank, TankWithLevel

EXACT_MATCH_THRESHOLD = 95  # Consider exact if score >= 95
SUGGESTION_THRESHOLD = 50   # Only suggest if score >= 50
MAX_SUGGESTIONS = 5


def find_adjustment_tank_matches(
    extracted_name: str,
    tanks: list[Tank]
) -> tuple[list[AdjustmentMatchSuggestion], bool]:
    """Find tanks that match the extracted name using fuzzy matching."""
    if not tanks:
        return [], False

    tank_names = {t.name: t for t in tanks}

    # Use token_set_ratio for better matching with different word orders
    matches = process.extract(
        extracted_name,
        tank_names.keys(),
        scorer=fuzz.token_set_ratio,
        limit=MAX_SUGGESTIONS
    )

    suggestions = []
    is_exact = False

    for name, score, _ in matches:
        if score >= SUGGESTION_THRESHOLD:
            tank = tank_names[name]
            suggestion = AdjustmentMatchSuggestion(
                tank_id=tank.id,
                tank_name=tank.name,
                confidence=score
            )
            suggestions.append(suggestion)

            if score >= EXACT_MATCH_THRESHOLD:
                is_exact = True

    return suggestions, is_exact


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
