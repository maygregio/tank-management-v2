"""PDF import API endpoints."""
import logging
from typing import List

from fastapi import APIRouter, UploadFile, File

from models import (
    Tank, Movement,
    PDFExtractionResult, PDFImportRequest, PDFImportResult
)
from services.storage import CosmosStorage
from services.blob_storage import PDFBlobStorage
from services.pdf_extraction import extract_text_from_pdf, extract_movements_with_ai
from services.tank_matching import process_extracted_movements

logger = logging.getLogger(__name__)

router = APIRouter()
tank_storage = CosmosStorage("tanks", Tank)
movement_storage = CosmosStorage("movements", Movement)
pdf_storage = PDFBlobStorage()


@router.post("/extract", response_model=List[PDFExtractionResult])
async def extract_from_pdfs(files: List[UploadFile] = File(...)):
    """Extract movement data from uploaded PDF files."""
    tanks = tank_storage.get_all()
    results = []

    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            results.append(PDFExtractionResult(
                filename=file.filename or "unknown",
                movements=[],
                extraction_errors=[f"File '{file.filename}' is not a PDF"]
            ))
            continue

        try:
            content = await file.read()

            # Store PDF in Azure Blob Storage
            try:
                blob_url = pdf_storage.upload_pdf(file.filename or "unknown.pdf", content)
                logger.info(f"PDF stored in blob storage: {blob_url}")
            except Exception as blob_error:
                logger.warning(f"Failed to store PDF in blob storage: {blob_error}")
                # Continue processing even if blob storage fails

            pdf_text = extract_text_from_pdf(content)

            if not pdf_text.strip():
                results.append(PDFExtractionResult(
                    filename=file.filename or "unknown",
                    movements=[],
                    extraction_errors=["Could not extract text from PDF (may be scanned/image-based)"]
                ))
                continue

            extracted = await extract_movements_with_ai(pdf_text)
            movements_with_matches = process_extracted_movements(extracted, tanks)

            results.append(PDFExtractionResult(
                filename=file.filename or "unknown",
                movements=movements_with_matches,
                extraction_errors=[]
            ))
        except Exception as e:
            results.append(PDFExtractionResult(
                filename=file.filename or "unknown",
                movements=[],
                extraction_errors=[str(e)]
            ))

    return results


@router.post("/confirm", response_model=PDFImportResult)
async def confirm_import(request: PDFImportRequest):
    """Create movements from confirmed import data."""
    created = 0
    errors = []

    for item in request.movements:
        try:
            # Validate tank exists
            tank = tank_storage.get_by_id(item.tank_id)
            if not tank:
                errors.append(f"Tank not found: {item.tank_id}")
                continue

            # Create completed movement
            movement = Movement(
                type=item.type,
                tank_id=item.tank_id,
                expected_volume=item.volume,
                actual_volume=item.volume,  # Completed immediately
                scheduled_date=item.date,
                notes=item.notes or "Imported from PDF"
            )

            movement_storage.create(movement)
            created += 1
        except Exception as e:
            errors.append(f"Failed to create movement: {str(e)}")

    return PDFImportResult(
        created_count=created,
        failed_count=len(errors),
        errors=errors
    )
