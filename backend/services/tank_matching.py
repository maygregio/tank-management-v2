from models import (
    Tank, TankMatchSuggestion, PDFExtractedMovement,
    PDFMovementWithMatches, MovementType
)
from services.fuzzy_matching import build_tank_match_suggestions


def find_tank_matches(
    extracted_name: str,
    tanks: list[Tank]
) -> tuple[list[TankMatchSuggestion], bool]:
    """Find tanks that match the extracted name using fuzzy matching."""
    return build_tank_match_suggestions(
        extracted_name,
        tanks,
        lambda tank, score: TankMatchSuggestion(
            tank_id=tank.id,
            tank_name=tank.name,
            confidence=score
        )
    )


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
