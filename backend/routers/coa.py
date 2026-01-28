"""Certificate of Analysis (COA) API endpoints."""
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from models import Movement, CertificateOfAnalysis, COALinkRequest, COAWithSignal
from services.storage import CosmosStorage
from services.blob_storage import PDFBlobStorage
from services.coa_extraction import process_coa_pdf

logger = logging.getLogger(__name__)

router = APIRouter()
coa_storage = CosmosStorage("certificates_of_analysis", CertificateOfAnalysis)
movement_storage = CosmosStorage("movements", Movement)
pdf_storage = PDFBlobStorage()


@router.post("/upload", response_model=COAWithSignal)
async def upload_coa(
    file: UploadFile = File(...),
    signal_id: Optional[str] = Query(None, description="Signal ID to link the COA to")
):
    """
    Upload a Certificate of Analysis PDF, extract data, and optionally link to a signal.

    The COA will be processed through AI extraction to capture chemical properties.
    If signal_id is provided, the COA will be linked to that signal.
    If nomination_key is extracted, the system will attempt to auto-match to a signal.
    """
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        content = await file.read()

        # Store PDF in Azure Blob Storage
        try:
            pdf_url = pdf_storage.upload_pdf(f"coa_{file.filename}", content)
            logger.info(f"COA PDF stored in blob storage: {pdf_url}")
        except Exception as blob_error:
            logger.error(f"Failed to store COA PDF in blob storage: {blob_error}")
            raise HTTPException(
                status_code=500,
                detail="Failed to store PDF file"
            )

        # Process COA with AI extraction
        coa = await process_coa_pdf(content, pdf_url)

        # Link to signal if provided directly
        if signal_id:
            # Verify signal exists
            signal = movement_storage.get_by_id(signal_id)
            if not signal:
                raise HTTPException(status_code=404, detail=f"Signal not found: {signal_id}")
            coa.signal_id = signal_id

        # Try to auto-match by nomination_key if no signal_id provided
        elif coa.nomination_key:
            signals = movement_storage.get_all()
            for signal in signals:
                if signal.nomination_key and signal.nomination_key == coa.nomination_key:
                    coa.signal_id = signal.id
                    logger.info(f"Auto-matched COA to signal via nomination_key: {coa.nomination_key}")
                    break

        # Check if there's an existing COA for this signal and replace it
        if coa.signal_id:
            existing_coas = coa_storage.filter(signal_id=coa.signal_id)
            for existing in existing_coas:
                coa_storage.delete(existing.id)
                logger.info(f"Replaced existing COA {existing.id} for signal {coa.signal_id}")

        # Store the COA
        coa_storage.create(coa)

        # Return COA with linked signal info
        linked_signal = None
        if coa.signal_id:
            linked_signal = movement_storage.get_by_id(coa.signal_id)

        return COAWithSignal(**coa.model_dump(), signal=linked_signal)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing COA: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing COA: {str(e)}")


@router.get("", response_model=list[COAWithSignal])
async def get_all_coas():
    """Get all Certificates of Analysis with their linked signals."""
    coas = coa_storage.get_all()
    result = []

    for coa in coas:
        linked_signal = None
        if coa.signal_id:
            linked_signal = movement_storage.get_by_id(coa.signal_id)
        result.append(COAWithSignal(**coa.model_dump(), signal=linked_signal))

    # Sort by created_at descending (newest first)
    result.sort(key=lambda x: x.created_at, reverse=True)
    return result


@router.get("/{coa_id}", response_model=COAWithSignal)
async def get_coa(coa_id: str):
    """Get a specific Certificate of Analysis by ID."""
    coa = coa_storage.get_by_id(coa_id)
    if not coa:
        raise HTTPException(status_code=404, detail="COA not found")

    linked_signal = None
    if coa.signal_id:
        linked_signal = movement_storage.get_by_id(coa.signal_id)

    return COAWithSignal(**coa.model_dump(), signal=linked_signal)


@router.get("/signal/{signal_id}", response_model=Optional[COAWithSignal])
async def get_coa_by_signal(signal_id: str):
    """Get the Certificate of Analysis for a specific signal."""
    # Verify signal exists
    signal = movement_storage.get_by_id(signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    coas = coa_storage.filter(signal_id=signal_id)
    if not coas:
        return None

    coa = coas[0]
    return COAWithSignal(**coa.model_dump(), signal=signal)


@router.post("/{coa_id}/link", response_model=COAWithSignal)
async def link_coa_to_signal(coa_id: str, request: COALinkRequest):
    """Manually link a COA to a signal."""
    coa = coa_storage.get_by_id(coa_id)
    if not coa:
        raise HTTPException(status_code=404, detail="COA not found")

    signal = movement_storage.get_by_id(request.signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    # Remove any existing COAs for this signal (one COA per signal rule)
    existing_coas = coa_storage.filter(signal_id=request.signal_id)
    for existing in existing_coas:
        if existing.id != coa_id:
            coa_storage.delete(existing.id)
            logger.info(f"Removed existing COA {existing.id} when linking new COA to signal")

    # Update the COA with the signal link
    updated_coa = coa_storage.update(coa_id, {"signal_id": request.signal_id})

    return COAWithSignal(**updated_coa.model_dump(), signal=signal)


@router.delete("/{coa_id}")
async def delete_coa(coa_id: str):
    """Delete a Certificate of Analysis."""
    coa = coa_storage.get_by_id(coa_id)
    if not coa:
        raise HTTPException(status_code=404, detail="COA not found")

    coa_storage.delete(coa_id)
    return {"message": "COA deleted successfully"}
