import fitz  # pymupdf
import json
import os
from datetime import date
from openai import OpenAI
from models import PDFExtractedMovement

# OpenAI client - initialized lazily
_client = None


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key)
    return _client


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


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text content from PDF bytes."""
    doc = fitz.open(stream=pdf_content, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


async def extract_movements_with_ai(pdf_text: str) -> list[PDFExtractedMovement]:
    """Use AI to extract structured movement data from PDF text."""
    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a data extraction specialist. Your job is to locate volume difference tables in PDF text and extract the data as JSON. Ignore all non-tabular content."
            },
            {
                "role": "user",
                "content": EXTRACTION_PROMPT + pdf_text[:15000]  # Limit text length
            }
        ],
        temperature=0,
        max_tokens=4000
    )

    content = response.choices[0].message.content.strip()

    # Handle markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        # Remove first and last lines (``` markers)
        content = "\n".join(lines[1:-1])
        if content.startswith("json"):
            content = content[4:].strip()

    data = json.loads(content)
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
