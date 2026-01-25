"""Adjustment PDF extraction service for monthly inspection readings."""
from datetime import date

from models.adjustments import AdjustmentExtractedReading
from services.ai_extraction import call_openai_extraction, AIExtractionError

SYSTEM_PROMPT = "You are a data extraction specialist. Your job is to locate tank level readings in monthly inspection PDF text and extract the data as JSON. Focus on physical readings/measurements."

ADJUSTMENT_EXTRACTION_PROMPT = """This PDF contains a monthly inspection report with physical tank level readings.

WHAT TO LOOK FOR:
- Tables or lists with tank names and their physical level readings
- Inspection/reading date (usually at the top or in headers)
- Volume/level values in barrels or liters

WHAT TO EXTRACT:
For each tank reading, extract:
- tank_name: Tank identifier/name
- physical_level: The physical reading value (in barrels or the shown unit)
- inspection_date: The date of the inspection/reading (YYYY-MM-DD format)

IMPORTANT:
- The inspection_date should be the same for all readings if it's a single inspection report
- If no date is found, use null for inspection_date

Return a JSON array. Example:
[
  {"tank_name": "TQ-01", "physical_level": 5000.0, "inspection_date": "2024-01-01"},
  {"tank_name": "TQ-02", "physical_level": 7500.0, "inspection_date": "2024-01-01"}
]

Return [] if no tank readings are found.
Return ONLY the JSON array, no explanation.

PDF TEXT:
"""


async def extract_adjustments_with_ai(pdf_text: str) -> list[AdjustmentExtractedReading]:
    """Use AI to extract structured adjustment readings from PDF text."""
    data = call_openai_extraction(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=ADJUSTMENT_EXTRACTION_PROMPT + pdf_text[:15000],  # Limit text length
        max_tokens=4000
    )

    readings = []
    for idx, item in enumerate(data):
        # Parse date if provided
        inspection_date = None
        if item.get("inspection_date"):
            try:
                inspection_date = date.fromisoformat(item["inspection_date"])
            except (ValueError, TypeError):
                pass

        readings.append(AdjustmentExtractedReading(
            tank_name=str(item.get("tank_name", "Unknown")),
            physical_level=float(item.get("physical_level", 0)),
            inspection_date=inspection_date,
            row_index=idx
        ))

    return readings
