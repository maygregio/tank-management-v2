"""Adjustment PDF import API endpoints."""
import logging
from datetime import date
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from models import (
    Tank, Movement, MovementType,
    AdjustmentExtractionResult, AdjustmentImportRequest, AdjustmentImportResult,
)
from services.storage import CosmosStorage
from services.blob_storage import PDFBlobStorage
from services.pdf_extraction import extract_text_from_pdf
from services.adjustment_extraction import extract_adjustments_with_ai
from services.adjustment_matching import process_extracted_adjustments
from services.calculations import calculate_tank_level, calculate_adjustment, get_tank_with_level

logger = logging.getLogger(__name__)

router = APIRouter()
tank_storage = CosmosStorage("tanks", Tank)
movement_storage = CosmosStorage("movements", Movement)
pdf_storage = PDFBlobStorage()


def is_first_of_month(d: date) -> bool:
    """Check if the date is the first of the month."""
    return d.day == 1


def validate_first_of_month():
    """Validate that today is the first of the month."""
    today = date.today()
    if not is_first_of_month(today):
        raise HTTPException(
            status_code=400,
            detail=f"Adjustments can only be imported on the first of the month. Today is {today.isoformat()}."
        )


@router.post("/extract", response_model=List[AdjustmentExtractionResult])
async def extract_from_pdfs(files: List[UploadFile] = File(...)):
    """Extract adjustment data from uploaded PDF files.

    Validates that today is the first of the month before processing.
    """
    # Validate current date is first of month
    validate_first_of_month()

    tanks = tank_storage.get_all()
    movements = movement_storage.get_all()
    tanks_with_levels = [get_tank_with_level(tank, movements) for tank in tanks]

    results = []

    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            results.append(AdjustmentExtractionResult(
                filename=file.filename or "unknown",
                readings=[],
                extraction_errors=[f"File '{file.filename}' is not a PDF"]
            ))
            continue

        try:
            content = await file.read()
            pdf_url = None

            # Store PDF in Azure Blob Storage
            try:
                pdf_url = pdf_storage.upload_pdf(file.filename or "unknown.pdf", content)
                logger.info(f"PDF stored in blob storage: {pdf_url}")
            except Exception as blob_error:
                logger.warning(f"Failed to store PDF in blob storage: {blob_error}")
                # Continue processing even if blob storage fails

            pdf_text = extract_text_from_pdf(content)

            if not pdf_text.strip():
                results.append(AdjustmentExtractionResult(
                    filename=file.filename or "unknown",
                    pdf_url=pdf_url,
                    readings=[],
                    extraction_errors=["Could not extract text from PDF (may be scanned/image-based)"]
                ))
                continue

            extracted = await extract_adjustments_with_ai(pdf_text)

            # Validate inspection dates are first of month
            extraction_errors = []
            for reading in extracted:
                if reading.inspection_date and not is_first_of_month(reading.inspection_date):
                    extraction_errors.append(
                        f"Tank '{reading.tank_name}' has inspection date {reading.inspection_date.isoformat()} which is not the first of the month"
                    )

            readings_with_matches = process_extracted_adjustments(extracted, tanks, tanks_with_levels)

            results.append(AdjustmentExtractionResult(
                filename=file.filename or "unknown",
                pdf_url=pdf_url,
                readings=readings_with_matches,
                extraction_errors=extraction_errors
            ))
        except Exception as e:
            results.append(AdjustmentExtractionResult(
                filename=file.filename or "unknown",
                readings=[],
                extraction_errors=[str(e)]
            ))

    return results


@router.post("/confirm", response_model=AdjustmentImportResult)
async def confirm_import(request: AdjustmentImportRequest):
    """Create adjustment movements from confirmed import data.

    Validates that:
    1. Today is the first of the month
    2. All inspection dates are the first of the month
    """
    # Validate current date is first of month
    validate_first_of_month()

    created = 0
    errors = []

    for item in request.adjustments:
        try:
            # Validate inspection date is first of month
            if not is_first_of_month(item.inspection_date):
                errors.append(
                    f"Inspection date {item.inspection_date.isoformat()} is not the first of the month"
                )
                continue

            # Validate tank exists
            tank = tank_storage.get_by_id(item.tank_id)
            if not tank:
                errors.append(f"Tank not found: {item.tank_id}")
                continue

            # Validate physical level within capacity
            if item.physical_level > tank.capacity:
                errors.append(
                    f"Physical level {item.physical_level} exceeds tank capacity {tank.capacity}"
                )
                continue

            # Calculate current system level and adjustment
            movements = movement_storage.get_all()
            current_level = calculate_tank_level(tank, movements)
            adjustment_quantity = calculate_adjustment(current_level, item.physical_level)

            # Build notes
            notes = item.notes or f"Physical reading adjustment. Previous: {current_level:.2f} bbl, Physical: {item.physical_level:.2f} bbl"
            if adjustment_quantity < 0:
                notes = f"(Loss) {notes}"
            else:
                notes = f"(Gain) {notes}"

            # Create completed adjustment movement with PDF reference
            movement = Movement(
                type=MovementType.ADJUSTMENT,
                tank_id=item.tank_id,
                expected_volume=abs(adjustment_quantity),
                actual_volume=adjustment_quantity,  # Signed value
                scheduled_date=item.inspection_date,
                notes=notes,
                pdf_url=request.pdf_url  # Link to source PDF
            )

            movement_storage.create(movement)
            created += 1
        except Exception as e:
            errors.append(f"Failed to create adjustment: {str(e)}")

    return AdjustmentImportResult(
        created_count=created,
        failed_count=len(errors),
        errors=errors
    )


@router.get("/pdf/{blob_name:path}")
async def get_pdf(blob_name: str):
    """Proxy endpoint to serve PDFs from blob storage for access control.

    The blob_name should be the path portion of the blob URL after the container name.
    Example: "2024/01/01/120000_inspection.pdf"
    """
    try:
        content = pdf_storage.get_pdf(blob_name)
        return StreamingResponse(
            iter([content]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={blob_name.split('/')[-1]}"
            }
        )
    except Exception as e:
        logger.error(f"Failed to retrieve PDF: {e}")
        raise HTTPException(status_code=404, detail="PDF not found")
