import fitz  # pymupdf
import json
import os
from datetime import date, datetime
from openai import OpenAI
from models.schemas import CertificateOfAnalysis

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


COA_EXTRACTION_PROMPT = """Extract Certificate of Analysis (COA) data from this document for carbon black oil.

Look for the following information:

1. IDENTIFICATION:
   - nomination_key: Nomination Key, Reference Number, Shipment ID, Cargo ID, Batch Number
   - analysis_date: Analysis Date, Test Date, Report Date, Certificate Date (YYYY-MM-DD format)
   - refinery_equipment: Equipment name, Tank name, Vessel, Unit from the refinery
   - lab_name: Laboratory name, Testing facility, Certified by

2. CHEMICAL PROPERTIES (with typical ranges for reference):
   - bmci: Bureau of Mines Correlation Index (typical: 110-160)
   - api_gravity: API Gravity in degrees (typical: ~4.4)
   - specific_gravity: Specific Gravity at 15.56°C or 60°F (typical: min 1.10)
   - viscosity: Viscosity value (typical: 50-102 SUS or cSt)
   - viscosity_temp: Temperature for viscosity reading (e.g., "98.9°C", "210°F", "100°C")
   - sulfur_content: Sulfur Content in wt% (typical: max 0.5-1.0)
   - flash_point: Flash Point in °C, PMCC method (typical: min 98)
   - ash_content: Ash Content in wt% (typical: max 0.05)
   - moisture_content: Moisture/Water Content in wt% (typical: max 0.5)
   - toluene_insoluble: Toluene Insoluble/TI in wt% (typical: max 6)
   - sodium_content: Sodium/Na Content in ppm (typical: max 5)

Return a JSON object with these fields. Use null for any property not found in the document.
Return ONLY the JSON object, no explanation or markdown formatting.

Example output:
{
  "nomination_key": "NOM-2024-001",
  "analysis_date": "2024-01-15",
  "refinery_equipment": "Tank TK-101",
  "lab_name": "Quality Control Lab",
  "bmci": 125.5,
  "api_gravity": 4.2,
  "specific_gravity": 1.12,
  "viscosity": 75.0,
  "viscosity_temp": "98.9°C",
  "sulfur_content": 0.35,
  "flash_point": 110.0,
  "ash_content": 0.02,
  "moisture_content": 0.15,
  "toluene_insoluble": 2.5,
  "sodium_content": 3.0
}

DOCUMENT TEXT:
"""


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text content from PDF bytes."""
    doc = fitz.open(stream=pdf_content, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


async def extract_coa_with_ai(pdf_text: str) -> dict:
    """Use AI to extract structured COA data from PDF text."""
    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a chemical analysis data extraction specialist. Your job is to extract Certificate of Analysis data for carbon black oil from PDF documents. Be precise with numerical values and units."
            },
            {
                "role": "user",
                "content": COA_EXTRACTION_PROMPT + pdf_text[:15000]  # Limit text length
            }
        ],
        temperature=0,
        max_tokens=2000
    )

    content = response.choices[0].message.content.strip()

    # Handle markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        # Remove first and last lines (``` markers)
        content = "\n".join(lines[1:-1])
        if content.startswith("json"):
            content = content[4:].strip()

    return json.loads(content)


def parse_coa_extraction(raw_data: dict, pdf_url: str) -> CertificateOfAnalysis:
    """Parse raw extraction data into a CertificateOfAnalysis model."""

    # Parse analysis date if provided
    analysis_date = None
    if raw_data.get("analysis_date"):
        try:
            analysis_date = date.fromisoformat(raw_data["analysis_date"])
        except (ValueError, TypeError):
            pass

    # Helper to safely get float values
    def safe_float(value) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    return CertificateOfAnalysis(
        pdf_url=pdf_url,
        extraction_date=datetime.now(),
        nomination_key=raw_data.get("nomination_key"),
        analysis_date=analysis_date,
        refinery_equipment=raw_data.get("refinery_equipment"),
        lab_name=raw_data.get("lab_name"),
        bmci=safe_float(raw_data.get("bmci")),
        api_gravity=safe_float(raw_data.get("api_gravity")),
        specific_gravity=safe_float(raw_data.get("specific_gravity")),
        viscosity=safe_float(raw_data.get("viscosity")),
        viscosity_temp=raw_data.get("viscosity_temp"),
        sulfur_content=safe_float(raw_data.get("sulfur_content")),
        flash_point=safe_float(raw_data.get("flash_point")),
        ash_content=safe_float(raw_data.get("ash_content")),
        moisture_content=safe_float(raw_data.get("moisture_content")),
        toluene_insoluble=safe_float(raw_data.get("toluene_insoluble")),
        sodium_content=safe_float(raw_data.get("sodium_content")),
        raw_extraction=raw_data
    )


async def process_coa_pdf(pdf_content: bytes, pdf_url: str) -> CertificateOfAnalysis:
    """
    Full pipeline: extract text from PDF, use AI to extract COA data,
    and return a structured CertificateOfAnalysis object.
    """
    # Extract text from PDF
    pdf_text = extract_text_from_pdf(pdf_content)

    # Use AI to extract structured data
    raw_data = await extract_coa_with_ai(pdf_text)

    # Parse into model
    return parse_coa_extraction(raw_data, pdf_url)
