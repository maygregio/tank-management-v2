import fitz  # pymupdf
import json
import os
from datetime import date
from openai import OpenAI
from models.schemas import PDFExtractedMovement

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


EXTRACTION_PROMPT = """Analyze this text extracted from a PDF containing tank movement records.
Extract all movement entries from tables. Each movement should have:
- tank_name: The name/identifier of the tank
- level_before: Fuel level before the movement (in liters or the unit shown)
- level_after: Fuel level after the movement (in liters or the unit shown)
- movement_qty: The quantity moved (positive number, absolute value)
- movement_date: Date if shown (YYYY-MM-DD format) or null

Return a JSON array of objects. Example:
[
  {
    "tank_name": "Tank A1",
    "level_before": 5000.0,
    "level_after": 7000.0,
    "movement_qty": 2000.0,
    "movement_date": "2024-01-15"
  }
]

If you cannot extract any movement data, return an empty array [].
Only return the JSON array, no other text or explanation.

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
                "content": "You are a data extraction assistant. Extract tank movement data from text and return valid JSON only."
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
