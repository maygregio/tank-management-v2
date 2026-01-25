"""PDF extraction service for movement data."""
from datetime import date

from models import PDFExtractedMovement
from services.ai_extraction import (
    extract_text_from_pdf,
    call_openai_extraction,
    AIExtractionError,
)

SYSTEM_PROMPT = "You are a data extraction specialist. Your job is to locate volume difference tables in PDF text and extract the data as JSON. Ignore all non-tabular content."

EXTRACTION_PROMPT = """This PDF contains analysis reports with various content. Your task is to find ONLY the table(s) showing tank volume differences/movements.

WHAT TO LOOK FOR:
- Tables with columns like: tank name/ID, initial volume, final volume, difference/variation
- Tables showing feedstock movements or inventory changes
- Any tabular data with "before" and "after" volumes or level differences

WHAT TO IGNORE:
- Headers, footers, logos, addresses
- Introductory text, summaries, conclusions
- Tables without volume/level data
- Any content that is not a volume difference table

For each row in the volume table(s), extract:
- tank_name: Tank identifier/name from the row
- level_before: Starting volume/level (in liters or shown unit)
- level_after: Ending volume/level (in liters or shown unit)
- movement_qty: The difference/variation amount (absolute value)
- movement_date: Date if shown in the table (YYYY-MM-DD) or null

Return a JSON array. Example:
[
  {"tank_name": "TQ-01", "level_before": 5000.0, "level_after": 7000.0, "movement_qty": 2000.0, "movement_date": "2024-01-15"}
]

Return [] if no volume difference table is found.
Return ONLY the JSON array, no explanation.

PDF TEXT:
"""


async def extract_movements_with_ai(pdf_text: str) -> list[PDFExtractedMovement]:
    """Use AI to extract structured movement data from PDF text."""
    data = call_openai_extraction(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=EXTRACTION_PROMPT + pdf_text[:15000],  # Limit text length
        max_tokens=4000
    )

    movements = []
    for idx, item in enumerate(data):
        # Parse date if provided
        movement_date = None
        if item.get("movement_date"):
            try:
                movement_date = date.fromisoformat(item["movement_date"])
            except (ValueError, TypeError):
                pass

        movements.append(PDFExtractedMovement(
            tank_name=str(item.get("tank_name", "Unknown")),
            level_before=float(item.get("level_before", 0)),
            level_after=float(item.get("level_after", 0)),
            movement_qty=abs(float(item.get("movement_qty", 0))),
            movement_date=movement_date,
            row_index=idx
        ))

    return movements
