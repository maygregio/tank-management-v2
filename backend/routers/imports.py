"""PDF import API endpoints."""
import logging
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends

from models import (
    Tank, MovementCreate,
    PDFExtractionResult, PDFImportRequest, PDFImportResult
)
from services.storage import CosmosStorage
from services.blob_storage import PDFBlobStorage
from services.pdf_extraction import extract_text_from_pdf, extract_movements_with_ai
from services.tank_matching import process_extracted_movements
from services.movement_service import MovementService, MovementServiceError, get_movement_service

logger = logging.getLogger(__name__)

router = APIRouter()
tank_storage = CosmosStorage("tanks", Tank)
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
async def confirm_import(
    request: PDFImportRequest,
    service: MovementService = Depends(get_movement_service)
):
    """Create movements from confirmed import data."""
    created = 0
    errors = []

    for item in request.movements:
        try:
            movement_data = MovementCreate(
                type=item.type,
                tank_id=item.tank_id,
                target_tank_id=None,
                expected_volume=item.volume,
                scheduled_date=item.date,
                notes=item.notes
            )
            service.create_completed(movement_data, actual_volume=item.volume)
            created += 1
        except MovementServiceError as e:
            errors.append(f"Failed to create movement: {e.message}")
        except Exception as e:
            errors.append(f"Failed to create movement: {str(e)}")

    return PDFImportResult(
        created_count=created,
        failed_count=len(errors),
        errors=errors
    )
