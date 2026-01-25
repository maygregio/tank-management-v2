"""COA (Certificate of Analysis) PDF extraction service."""
from datetime import date, datetime

from models import CertificateOfAnalysis
from services.ai_extraction import (
    extract_text_from_pdf,
    call_openai_extraction,
    AIExtractionError,
)

SYSTEM_PROMPT = "You are a chemical analysis data extraction specialist. Your job is to extract Certificate of Analysis data for carbon black oil from PDF documents. Be precise with numerical values and units."

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
   - specific_gravity: Specific Gravity at 15.56C or 60F (typical: min 1.10)
   - viscosity: Viscosity value (typical: 50-102 SUS or cSt)
   - viscosity_temp: Temperature for viscosity reading (e.g., "98.9C", "210F", "100C")
   - sulfur_content: Sulfur Content in wt% (typical: max 0.5-1.0)
   - flash_point: Flash Point in C, PMCC method (typical: min 98)
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
  "viscosity_temp": "98.9C",
  "sulfur_content": 0.35,
  "flash_point": 110.0,
  "ash_content": 0.02,
  "moisture_content": 0.15,
  "toluene_insoluble": 2.5,
  "sodium_content": 3.0
}

DOCUMENT TEXT:
"""


async def extract_coa_with_ai(pdf_text: str) -> dict:
    """Use AI to extract structured COA data from PDF text."""
    return call_openai_extraction(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=COA_EXTRACTION_PROMPT + pdf_text[:15000],  # Limit text length
        max_tokens=2000
    )


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
