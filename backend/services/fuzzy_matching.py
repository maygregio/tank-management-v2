"""Shared fuzzy matching helpers for tank suggestions."""
from __future__ import annotations

from collections.abc import Callable
from typing import TypeVar

from rapidfuzz import fuzz, process

from models import Tank

EXACT_MATCH_THRESHOLD = 95  # Consider exact if score >= 95
SUGGESTION_THRESHOLD = 50   # Only suggest if score >= 50
MAX_SUGGESTIONS = 5

SuggestionT = TypeVar("SuggestionT")


def build_tank_match_suggestions(
    extracted_name: str,
    tanks: list[Tank],
    suggestion_factory: Callable[[Tank, float], SuggestionT],
    *,
    exact_match_threshold: int = EXACT_MATCH_THRESHOLD,
    suggestion_threshold: int = SUGGESTION_THRESHOLD,
    max_suggestions: int = MAX_SUGGESTIONS
) -> tuple[list[SuggestionT], bool]:
    """Build fuzzy match suggestions for a tank name."""
    if not tanks:
        return [], False

    tank_names = {t.name: t for t in tanks}

    # Use token_set_ratio for better matching with different word orders
    matches = process.extract(
        extracted_name,
        tank_names.keys(),
        scorer=fuzz.token_set_ratio,
        limit=max_suggestions
    )

    suggestions: list[SuggestionT] = []
    is_exact = False

    for name, score, _ in matches:
        if score >= suggestion_threshold:
            tank = tank_names[name]
            suggestions.append(suggestion_factory(tank, score))
            if score >= exact_match_threshold:
                is_exact = True

    return suggestions, is_exact
