# Tank Management System Architecture

## Overview
The solution is split into a Next.js frontend and a FastAPI backend. The frontend renders dashboards and workflows for tank monitoring, while the backend exposes REST APIs, performs domain calculations, and integrates with Azure services and OpenAI for PDF-based imports.

## Frontend (Next.js)
- Framework: Next.js App Router with TypeScript and React Query for data fetching.
- UI layer: MUI components, shared theme tokens, and custom widgets for tank status.
- API access: `src/lib/api.ts` wraps REST calls to the backend (`http://localhost:8000/api`).
- Domain types: `src/lib/types.ts` defines the shared frontend model for tanks, movements, imports, and dashboard stats.
- Layout: `src/app/layout.tsx` composes global providers, navigation, and page shell.

### Key areas
- `src/app/page.tsx` is the dashboard view, grouping tanks by location and showing KPIs.
- `src/app/tanks` provides list + detail views for tanks and their movement history.
- `src/app/movements`, `src/app/adjustments`, `src/app/imports` drive scheduling, adjustments, and PDF import workflows.
- `src/components` contains reusable widgets like tank cards, status chips, and navigation.
- `src/lib/theme.ts` and `src/app/globals.css` define UI styling and tokens.

## Backend (FastAPI)
- Framework: FastAPI with Pydantic models and modular routers.
- API root: `backend/main.py` mounts routers at `/api` and enables CORS for the frontend.
- Models: `backend/models/schemas.py` defines tanks, movements, dashboard stats, and PDF import DTOs.

### Routers
- `backend/routers/tanks.py`: CRUD for tanks, dashboard stats, and tank history.
- `backend/routers/movements.py`: scheduling, updates, completion, transfers, and adjustments.
- `backend/routers/imports.py`: PDF extraction + confirmation flow.

### Services
- `backend/services/storage.py`: Cosmos DB access layer with serialization helpers.
- `backend/services/calculations.py`: tank level math and adjustments.
- `backend/services/tank_matching.py`: fuzzy match extraction results to tanks.
- `backend/services/pdf_extraction.py`: extracts text (PyMuPDF) and calls OpenAI to structure movement data.
- `backend/services/blob_storage.py`: Azure Blob Storage for uploaded PDFs.

## Data flow
1. UI calls REST endpoints via `src/lib/api.ts`.
2. Routers load entities from Cosmos DB and apply calculations or validations.
3. Movements impact computed tank levels in `calculate_tank_level`.
4. PDF import flow:
   - Upload files to `/api/imports/extract`.
   - Backend stores PDFs in blob storage, extracts text, calls OpenAI, and matches tanks.
   - UI confirms matches and submits `/api/imports/confirm` to create completed movements.

## External dependencies
- Cosmos DB via `COSMOS_CONNECTION_STRING` and `COSMOS_DATABASE_NAME`.
- Azure Blob Storage via `AZURE_BLOB_CONNECTION_STRING` and `AZURE_BLOB_CONTAINER_NAME`.
- OpenAI via `OPENAI_API_KEY` for PDF extraction.

## Integration guidance (for the agent)
- Preserve API contracts used by `frontend/src/lib/api.ts` or update both sides in sync; the frontend expects `/api/tanks`, `/api/movements`, `/api/imports` with current payload shapes.
- Keep environment variables aligned when integrating: `COSMOS_CONNECTION_STRING`, `COSMOS_DATABASE_NAME`, `AZURE_BLOB_CONNECTION_STRING`, `AZURE_BLOB_CONTAINER_NAME`, `OPENAI_API_KEY`.
- If the larger system already has auth, add a dependency-aware middleware in `backend/main.py` and pass auth headers through `fetchAPI` in `frontend/src/lib/api.ts`.
- For service reuse, wrap the FastAPI app in the larger backend's routing layer (mount at `/api`) or proxy the Next.js app to the API base.
- If storage differs from Cosmos DB, replace `services/storage.py` with a compatible repository layer and keep model shapes stable.

## Notes
- Tank levels are derived from initial levels plus movement history (including transfers and adjustments).
- Transfer movements are stored as individual records per target tank.
- Adjustments immediately complete with signed actual volumes to capture gains/losses.
