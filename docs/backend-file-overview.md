# Backend File Overview

This document describes each file in the `backend/` directory and its purpose in the Tank Management API.

---

## Root Files

### `main.py`
**Purpose:** Application entry point and FastAPI configuration.

- Initializes the FastAPI application with metadata (title, description, version)
- Configures CORS middleware using `ALLOWED_ORIGINS` environment variable
- Sets up logging with timestamps and module names
- Registers all API routers with their URL prefixes:
  - `/api/tanks` - Tank management
  - `/api/movements` - Movement operations
  - `/api/movements/signals` - Signal workflow
  - `/api/imports` - PDF movement imports
  - `/api/coa` - Certificate of Analysis
  - `/api/adjustments` - Monthly adjustment imports
- Provides global exception handler for unhandled errors
- Includes health check endpoint (`/api/health`) and root endpoint (`/`)

### `requirements.txt`
**Purpose:** Python package dependencies.

Key dependencies:
- `fastapi` + `uvicorn` - Web framework and ASGI server
- `pydantic` - Data validation and serialization
- `azure-cosmos` - Azure Cosmos DB client
- `azure-storage-blob` - Azure Blob Storage for PDFs
- `openai` - AI-powered PDF data extraction
- `pymupdf` - PDF text extraction
- `rapidfuzz` - Fuzzy string matching for tank name matching
- `openpyxl` - Excel file parsing for signal imports

### `.env`
**Purpose:** Environment configuration (not committed to version control).

Required variables:
- `COSMOS_CONNECTION_STRING` - Azure Cosmos DB connection
- `COSMOS_DATABASE_NAME` - Database name
- `OPENAI_API_KEY` - OpenAI API for PDF extraction
- `AZURE_BLOB_CONNECTION_STRING` - Blob storage for PDFs
- `AZURE_BLOB_CONTAINER_NAME` - Blob container name
- `ALLOWED_ORIGINS` - CORS allowed origins

---

## Models (`models/`)

Pydantic models defining data structures for the API.

### `__init__.py`
**Purpose:** Package exports for all model classes.

Re-exports all models from submodules for convenient imports like `from models import Tank, Movement`.

### `shared.py`
**Purpose:** Shared utilities and enums used across all models.

Contains:
- `generate_id()` - Creates UUIDs for database records
- `utc_now()` - Returns current UTC datetime
- `FeedstockType` enum - Types of feedstock (CARBON_BLACK_OIL, OTHER)
- `MovementType` enum - Movement types (LOAD, DISCHARGE, TRANSFER, ADJUSTMENT)

### `tanks.py`
**Purpose:** Tank-related data models.

Models:
- `TankBase` - Base fields: name, location, feedstock_type, capacity, initial_level
- `TankCreate` - Input model for creating tanks
- `TankUpdate` - Partial update model (all fields optional)
- `Tank` - Complete model with id, created_at, and **current_level** (denormalized, updated when movements change)
- `TankWithLevel` - Tank with level_percentage for display (inherits current_level from Tank)

### `movements.py`
**Purpose:** Movement and signal data models.

Key design: Uses paired fields pattern (`*_default` for system values, `*_manual` for user overrides) with computed properties that return `manual ?? default`.

**Validation:** `actual_volume` must be non-negative for all movement types except ADJUSTMENT (which can be negative for loss adjustments).

Models:
- `MovementBase` - Base with paired fields for tank_id, volume, date, notes, trade info, workflow fields, **resulting_volume** (source tank level after movement), and **target_resulting_volume** (target tank level after transfer)
- `MovementCreate` - Simple input for manual movement creation
- `TransferCreate` - Multi-target transfer creation (source + list of targets)
- `TransferTarget` - Single target tank with volume
- `MovementComplete` - Recording actual volume
- `MovementUpdate` - Updating pending movements (uses `*_manual` fields)
- `SignalAssignment` - Assigning unassigned signals to tanks
- `TradeInfoUpdate` - Adding trade number and line item
- `Movement` - Complete model with id and timestamp
- `AdjustmentCreate` - Physical reading adjustment input
- `MovementWithCOA` - Movement joined with COA chemical properties for overview

### `imports.py`
**Purpose:** PDF movement import data models.

Models:
- `PDFExtractedMovement` - Raw data extracted from PDF (tank name, levels, volume, date)
- `TankMatchSuggestion` - Fuzzy match result with tank_id, name, and confidence score
- `PDFMovementWithMatches` - Extracted movement with tank matching suggestions
- `PDFExtractionResult` - Complete extraction result per file
- `PDFImportConfirmItem` - User-confirmed movement to import
- `PDFImportRequest` - Batch import request
- `PDFImportResult` - Import result with counts and errors

### `adjustments.py`
**Purpose:** Monthly adjustment import data models.

Similar structure to imports.py but for physical reading adjustments:
- `AdjustmentExtractedReading` - Raw reading from PDF (tank name, physical level, date)
- `AdjustmentMatchSuggestion` - Tank match with confidence
- `AdjustmentReadingWithMatches` - Reading with matches, system level, and calculated delta
- `AdjustmentExtractionResult` - Extraction result per PDF
- `AdjustmentImportConfirmItem` - Confirmed adjustment to import
- `AdjustmentImportRequest` - Batch import with optional PDF URL
- `AdjustmentImportResult` - Import counts and errors

### `coa.py`
**Purpose:** Certificate of Analysis data models.

Models:
- `CertificateOfAnalysis` - Full COA with chemical properties:
  - Identification: signal_id, nomination_key, pdf_url, analysis_date, refinery_equipment, lab_name
  - Chemical properties: bmci, api_gravity, specific_gravity, viscosity, sulfur_content, flash_point, ash_content, moisture_content, toluene_insoluble, sodium_content
  - Stores raw_extraction for debugging
- `COAUploadRequest` - Optional signal_id for linking
- `COALinkRequest` - Manual signal linking
- `COAWithSignal` - COA with linked signal data for API responses

---

## Routers (`routers/`)

FastAPI routers defining API endpoints.

### `__init__.py`
**Purpose:** Package exports for all router modules.

### `tanks.py`
**Purpose:** Tank CRUD endpoints.

Endpoints:
- `GET /api/tanks` - List all tanks with levels (filter by location; pagination: skip, limit)
- `GET /api/tanks/{id}` - Get single tank with level
- `GET /api/tanks/{id}/history` - Get movement history for a tank (pagination: skip, limit)
- `GET /api/tanks/{id}/volume-history` - Get daily EOD volume history (query params: start_date, end_date)
- `POST /api/tanks` - Create new tank
- `PUT /api/tanks/{id}` - Update tank
- `DELETE /api/tanks/{id}` - Delete tank

Uses `TankService` via dependency injection.

### `movements.py`
**Purpose:** Movement CRUD and operations.

Endpoints:
- `GET /api/movements` - List movements (filter by tank_id, type, status; pagination: skip, limit)
- `GET /api/movements/overview` - Get movements joined with COA data for grid display (filter by tank_id, type, status; pagination: skip, limit)
- `POST /api/movements` - Create scheduled movement
- `POST /api/movements/transfer` - Create multi-target transfer
- `POST /api/movements/adjustment` - Create adjustment from physical reading
- `PUT /api/movements/{id}` - Update pending movement
- `PUT /api/movements/{id}/complete` - Record actual volume
- `DELETE /api/movements/{id}` - Delete movement

Uses `MovementService` via dependency injection.

### `signals.py`
**Purpose:** Signal workflow endpoints.

Endpoints:
- `GET /api/movements/signals` - Get pending signals (unassigned OR missing trade info)
- `POST /api/movements/signals/upload` - Upload Excel file with refinery signals
- `PUT /api/movements/signals/{id}/assign` - Assign signal to tank with workflow fields
- `PUT /api/movements/signals/{id}/trade` - Add trade number and line item

Uses `SignalService` via dependency injection.

### `imports.py`
**Purpose:** PDF movement import endpoints.

Endpoints:
- `POST /api/imports/extract` - Extract movement data from uploaded PDFs
- `POST /api/imports/confirm` - Create movements from confirmed extractions

Uses AI extraction, tank matching, and stores PDFs in blob storage.

### `adjustments.py`
**Purpose:** Monthly adjustment import endpoints.

Endpoints:
- `POST /api/adjustments/extract` - Extract adjustment readings from PDFs
  - Validates current date is first of month
  - Validates inspection dates in PDF are first of month
- `POST /api/adjustments/confirm` - Create adjustment movements from confirmed readings
- `GET /api/adjustments/pdf/{blob_name}` - Proxy endpoint to serve PDFs from blob storage

Uses AI extraction, tank matching, delta calculation, and enforces first-of-month rules.

### `coa.py`
**Purpose:** Certificate of Analysis endpoints.

Endpoints:
- `POST /api/coa/upload` - Upload COA PDF with AI extraction, optional signal linking
- `GET /api/coa` - List all COAs with linked signals
- `GET /api/coa/{id}` - Get single COA
- `GET /api/coa/signal/{signal_id}` - Get COA for a specific signal
- `POST /api/coa/{id}/link` - Manually link COA to signal
- `DELETE /api/coa/{id}` - Delete COA

Supports auto-matching by nomination_key and replaces existing COAs when re-linking.

---

## Services (`services/`)

Business logic layer with service classes.

### `__init__.py`
**Purpose:** Package exports for services and utilities.

Exports service classes, singleton accessors, and calculation functions.

### `storage.py`
**Purpose:** Azure Cosmos DB data access layer.

Classes:
- `CosmosDBClient` - Singleton client managing database connection with shared throughput
- `CosmosStorage[T]` - Generic storage class with:
  - `get_all()` - List all items with pagination
  - `get_by_id()` - Single item lookup
  - `create()` - Insert new item
  - `update()` - Partial update
  - `delete()` - Remove item
  - `filter()` - Query by field values
  - `query()` - Custom queries with conditions and parameters
  - `count()` - Total item count

Handles datetime serialization and uses `/id` as partition key.

### `tank_service.py`
**Purpose:** Tank business logic.

`TankService` class:
- `get_all()` - Returns tanks with stored levels, optional location filter
- `get_by_id()` - Single tank with stored level
- `get_history()` - Movement history for a tank
- `get_volume_history()` - Daily EOD volume for a date range (uses resulting_volume for O(1) lookups)
- `create()` - Create new tank (sets current_level = initial_level)
- `update()` - Update tank properties
- `delete()` - Remove tank

Singleton accessor: `get_tank_service()`

### `movement_service.py`
**Purpose:** Movement business logic.

`MovementService` class:
- `get_all()` - List movements with filters (tank_id, type, status; pagination: skip, limit)
- `get_by_id()` - Single movement lookup
- `get_overview()` - Movements joined with COA chemical properties (filter by tank_id, type, status; pagination: skip, limit)
- `create()` - Create movement, sets resulting_volume (and target_resulting_volume for transfers), updates tank.current_level only if scheduled_date <= today
- `create_transfer()` - Multi-target transfer, sets both resulting_volume and target_resulting_volume, updates tank levels only if scheduled_date <= today
- `update()` - Update pending movement, recalculates volumes if amount/tank changed
- `complete()` - Record actual volume, recalculates from this movement forward
- `create_adjustment()` - Create adjustment, sets resulting_volume = physical_level
- `delete()` - Remove movement, recalculates affected tanks from movement date forward

**Volume Maintenance:** All mutation methods maintain `resulting_volume` (source tank) and `target_resulting_volume` (target tank for transfers) on movements, and `current_level` on tanks. Future movements (scheduled_date > today) do NOT affect tank.current_level—only the resulting volumes are stored. When edits/deletes occur, subsequent movements are recalculated and current_level is updated only for movements up to today.

**Available Volume Calculation:** For discharge/transfer validation, `_get_available_volume_for_movement()` computes the tank level after applying all same-day movements that would be processed before the new/updated movement. This ensures validation accounts for other movements on the same day.

Custom exception: `MovementServiceError` with status code.
Singleton accessor: `get_movement_service()`

### `signal_service.py`
**Purpose:** Signal workflow business logic.

`SignalService` class:
- `get_pending_signals()` - Signals needing work (unassigned OR missing trade info)
- `upload_signals()` - Parse Excel and create signal movements (skips duplicates)
- `assign_signal()` - Assign to tank with workflow fields
- `update_trade_info()` - Add trade number and line item

Custom exception: `SignalServiceError` with status code.
Singleton accessor: `get_signal_service()`

### `calculations.py`
**Purpose:** Tank level calculation logic and helpers.

Functions:
- `get_effective_volume()` - Returns actual_volume if set, else expected_volume
- `calculate_tank_level()` - **Legacy:** Computes tank level from initial + movements (kept for verification/reconciliation)
  - LOAD: adds to tank
  - DISCHARGE: subtracts from tank
  - TRANSFER: subtracts from source, adds to target
  - ADJUSTMENT: adds signed value (can be negative)
  - Supports `as_of` date for point-in-time calculations
- `get_tank_with_level()` - Wraps tank with level_percentage (uses stored current_level)
- `calculate_adjustment()` - Computes adjustment needed: `physical_level - current_level`
- `apply_movement_to_level()` - Apply a single movement's effect to a tank level
- `get_volume_delta()` - Get the volume change a movement causes for a specific tank
- `recalculate_resulting_volumes()` - Recalculate resulting_volume for a list of movements

### `excel_parser.py`
**Purpose:** Excel file parsing for signal imports.

Classes:
- `ParsedSignal` - Single parsed signal (signal_id, load_date, refinery_tank_name, volume)
- `ExcelParseResult` - List of signals and parsing errors

Function:
- `parse_signals_excel()` - Parses Excel with flexible header matching
  - Supports column name variations (e.g., "Signal ID", "signal_id", "ID")
  - Handles multiple date formats
  - Validates required fields and data types

### `ai_extraction.py`
**Purpose:** Shared utilities for AI-based extraction from documents.

Functions:
- `get_openai_client()` - Lazily initialized OpenAI client singleton
- `extract_text_from_pdf()` - Uses PyMuPDF to extract text from PDF bytes
- `parse_ai_json_response()` - Parses JSON from AI responses, handles markdown code fences
- `call_openai_extraction()` - Calls OpenAI API with system/user prompts and parses JSON response

Custom exception: `AIExtractionError` with message and raw content for debugging.

Used by: `pdf_extraction.py`, `coa_extraction.py`, `adjustment_extraction.py`

### `pdf_extraction.py`
**Purpose:** PDF movement extraction using AI.

Functions:
- `extract_movements_with_ai()` - Sends PDF text to GPT-4o-mini with structured prompt
  - Extracts tank name, level before/after, movement quantity, date

Uses `ai_extraction.py` for OpenAI client and JSON parsing.

### `coa_extraction.py`
**Purpose:** Certificate of Analysis PDF extraction using AI.

Functions:
- `extract_coa_with_ai()` - GPT-4o-mini extraction of COA properties
- `parse_coa_extraction()` - Converts raw AI output to `CertificateOfAnalysis` model
- `process_coa_pdf()` - Full pipeline: extract text, AI extraction, parse to model

Extracts identification info and chemical properties (BMCI, API gravity, sulfur, etc.).

Uses `ai_extraction.py` for OpenAI client, PDF text extraction, and JSON parsing.

### `adjustment_extraction.py`
**Purpose:** Monthly adjustment PDF extraction using AI.

Functions:
- `extract_adjustments_with_ai()` - GPT-4o-mini extraction of tank readings
  - Extracts tank name, physical level, inspection date

Uses `ai_extraction.py` for OpenAI client, PDF text extraction, and JSON parsing.

### `adjustment_matching.py`
**Purpose:** Tank matching and delta calculation for adjustments.

Constants:
- `EXACT_MATCH_THRESHOLD = 95` - Score for exact match
- `SUGGESTION_THRESHOLD = 50` - Minimum score to suggest
- `MAX_SUGGESTIONS = 5` - Maximum match suggestions

Functions:
- `find_adjustment_tank_matches()` - Fuzzy matches extracted name to system tanks using `token_set_ratio`
- `process_extracted_adjustments()` - Processes readings, finds matches, calculates deltas
  - Delta = physical_level - system_level

### `tank_matching.py`
**Purpose:** Tank matching for PDF movement imports.

Constants: Same thresholds as adjustment_matching.py

Functions:
- `find_tank_matches()` - Fuzzy matches extracted tank name using RapidFuzz
- `infer_movement_type()` - Determines LOAD vs DISCHARGE based on level change
- `process_extracted_movements()` - Processes extractions with tank matches and movement types

### `blob_storage.py`
**Purpose:** Azure Blob Storage for PDF files.

Classes:
- `BlobStorageClient` - Singleton managing container client
- `PDFBlobStorage` - Service for PDF operations:
  - `upload_pdf()` - Stores PDF with timestamped path, returns URL
  - `get_pdf()` - Downloads PDF content
  - `delete_pdf()` - Removes PDF
  - `list_pdfs()` - Lists PDFs with optional prefix filter

Uses content type `application/pdf` and creates container if not exists.

---

## Architecture Summary

```
backend/
├── main.py              # FastAPI app entry point
├── requirements.txt     # Dependencies
├── .env                 # Environment config
│
├── models/              # Pydantic data models
│   ├── shared.py        # Enums, utilities
│   ├── tanks.py         # Tank models
│   ├── movements.py     # Movement/signal models
│   ├── imports.py       # PDF import models
│   ├── adjustments.py   # Adjustment import models
│   └── coa.py           # COA models
│
├── routers/             # API endpoints
│   ├── tanks.py         # Tank CRUD
│   ├── movements.py     # Movement operations
│   ├── signals.py       # Signal workflow
│   ├── imports.py       # PDF movement import
│   ├── adjustments.py   # Monthly adjustments
│   └── coa.py           # COA management
│
└── services/            # Business logic
    ├── storage.py       # Cosmos DB access
    ├── tank_service.py  # Tank operations
    ├── movement_service.py  # Movement operations
    ├── signal_service.py    # Signal workflow
    ├── calculations.py  # Level calculations
    ├── excel_parser.py  # Signal Excel parsing
    ├── ai_extraction.py     # Shared AI extraction utilities
    ├── pdf_extraction.py    # Movement PDF extraction
    ├── coa_extraction.py    # COA PDF extraction
    ├── adjustment_extraction.py  # Adjustment PDF extraction
    ├── tank_matching.py     # Movement tank matching
    ├── adjustment_matching.py   # Adjustment tank matching
    └── blob_storage.py  # Azure Blob Storage
```
