from rapidfuzz import fuzz, process
from models import (
    Tank, TankMatchSuggestion, PDFExtractedMovement,
    PDFMovementWithMatches, MovementType
)

EXACT_MATCH_THRESHOLD = 95  # Consider exact if score >= 95
SUGGESTION_THRESHOLD = 50   # Only suggest if score >= 50
MAX_SUGGESTIONS = 5


def find_tank_matches(
    extracted_name: str,
    tanks: list[Tank]
) -> tuple[list[TankMatchSuggestion], bool]:
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
            suggestion = TankMatchSuggestion(
                tank_id=tank.id,
                tank_name=tank.name,
                confidence=score
            )
            suggestions.append(suggestion)

            if score >= EXACT_MATCH_THRESHOLD:
                is_exact = True

    return suggestions, is_exact


def infer_movement_type(level_before: float, level_after: float) -> MovementType:
    """Infer movement type based on level change."""
    if level_after > level_before:
        return MovementType.LOAD
    else:
        return MovementType.DISCHARGE


def process_extracted_movements(
    extracted: list[PDFExtractedMovement],
    tanks: list[Tank]
) -> list[PDFMovementWithMatches]:
    """Process extracted movements and find tank matches."""
    results = []

    for movement in extracted:
        suggestions, is_exact = find_tank_matches(movement.tank_name, tanks)
        best_match = suggestions[0] if suggestions else None
        movement_type = infer_movement_type(movement.level_before, movement.level_after)

        results.append(PDFMovementWithMatches(
            extracted=movement,
            movement_type=movement_type,
            suggested_matches=suggestions,
            best_match=best_match,
            is_exact_match=is_exact
        ))

    return results
