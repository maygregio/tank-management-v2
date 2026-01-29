# Tank Management System Architecture

## Overview
The solution is split into a Next.js frontend and a FastAPI backend. The frontend renders dashboards and workflows for tank monitoring, while the backend exposes REST APIs, performs domain calculations, and integrates with Azure services and OpenAI for PDF-based imports.

## Frontend (Next.js)
- **Framework**: Next.js 16 App Router with TypeScript and React Query for data fetching
- **UI layer**: MUI v7 components, shared theme tokens, and custom widgets for tank status
- **API access**: `src/lib/api.ts` wraps REST calls to the backend (`http://localhost:8000/api`)
- **Domain types**: `src/lib/types.ts` defines shared frontend models
- **Layout**: `Navigation.tsx` provides tab-based navigation with page shell

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/tanks` |
| `/tanks` | Tank list and creation |
| `/tanks/[id]` | Tank detail with movement history |
| `/movements` | Schedule and complete movements (manual entry + PDF import) |
| `/overview` | Editable grid of movements with COA data and column profiles |
| `/signals` | Refinery signal management (assign tanks, add trade info) |
| `/coa` | Certificate of Analysis upload and linking |
| `/adjustments` | Monthly PDF-based adjustment imports |

### Key Frontend Files
```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── overview/          # Overview grid page
│   ├── movements/         # Movement scheduling
│   ├── signals/           # Signal management
│   ├── coa/               # COA management
│   └── adjustments/       # Adjustment imports
├── components/
│   ├── overview/          # OverviewGrid, ProfileSelector
│   ├── movements/         # Movement forms, dialogs, table
│   ├── DialogScaffold.tsx # Reusable dialog with glass-effect styling
│   ├── StyledDataGrid.tsx # Styled DataGrid with variant support
│   └── Navigation.tsx     # Tab-based navigation
└── lib/
    ├── api.ts             # API client functions
    ├── types.ts           # TypeScript interfaces
    ├── constants.ts       # Shared constants, styles, button styles, utilities
    ├── columnProfiles.ts  # Overview column visibility profiles
    └── columnPreferences.ts # localStorage for column preferences
```

## Backend (FastAPI)
- **Framework**: FastAPI with Pydantic models and modular routers
- **API root**: `backend/main.py` mounts routers at `/api` and enables CORS
- **Storage**: Azure Cosmos DB via generic `CosmosStorage[T]` class

### Models (`backend/models/`)
Models are split by domain:
| File | Contents |
|------|----------|
| `shared.py` | Enums (FeedstockType, MovementType), utilities (utc_now, generate_id) |
| `tanks.py` | Tank, TankCreate, TankUpdate, TankWithLevel |
| `movements.py` | Movement, MovementCreate, MovementUpdate, MovementWithCOA, SignalAssignment |
| `coa.py` | CertificateOfAnalysis, COAWithSignal, COALinkRequest |
| `imports.py` | PDF import models (PDFExtractionResult, etc.) |
| `adjustments.py` | Adjustment PDF import models |

### Routers (`backend/routers/`)
| Router | Endpoints |
|--------|-----------|
| `tanks.py` | CRUD for tanks, tank history |
| `movements.py` | Movement CRUD, `/overview` endpoint, transfers, adjustments |
| `signals.py` | Signal upload, assign, trade info |
| `coa.py` | COA upload, linking, management |
| `imports.py` | PDF extraction + confirmation |
| `adjustments.py` | Adjustment PDF extraction + confirmation |

### Services (`backend/services/`)
| Service | Purpose |
|---------|---------|
| `storage.py` | Generic `CosmosStorage[T]` for Cosmos DB operations |
| `tank_service.py` | Tank business logic |
| `movement_service.py` | Movement operations, overview join with COA |
| `signal_service.py` | Signal workflow logic |
| `calculations.py` | Tank level calculation from movements |
| `coa_extraction.py` | AI extraction of chemical properties from COA PDFs |
| `adjustment_extraction.py` | AI extraction from adjustment PDFs |
| `fuzzy_matching.py` | Shared fuzzy matching helpers for tank suggestions |
| `movement_queries.py` | Shared helpers for movement queries and date filtering |
| `adjustment_matching.py` | Fuzzy tank name matching for adjustments |
| `tank_matching.py` | Fuzzy tank name matching for PDF imports |
| `excel_parser.py` | Signal Excel file parsing |
| `blob_storage.py` | Azure Blob Storage for PDFs |

## Key Workflows

### Signal Workflow
1. **Upload**: Excel file creates signals (signal_id, load_date, refinery_tank, volume)
2. **Tank Assignment**: `PUT /movements/{id}/assign` - assigns destination tank
3. **Trade Info**: `PUT /movements/{id}/trade` - adds trade number and line item
4. Steps 2-3 can happen in any order; signal is complete when both are done.

### COA Workflow
1. **Upload**: PDF uploaded to `/api/coa/upload`, stored in Azure Blob
2. **Extraction**: GPT-4o-mini extracts chemical properties (BMCI, API Gravity, Sulfur, etc.)
3. **Linking**: COA linked to signal via `nomination_key` or manual linking

### Overview Grid
- `GET /api/movements/overview` returns `PaginatedResponse[MovementWithCOA]`
- Movements joined with COA data via `nomination_key` or `signal_id`
- Frontend displays editable DataGrid with column visibility profiles (All, Scheduler, Trader, Quality)
- Preferences saved to localStorage

### Server-Side Pagination
List endpoints return `PaginatedResponse[T]` with server-side pagination:

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]  # Page of results
    total: int      # Total count matching filters
    skip: int       # Offset used
    limit: int      # Page size used
```

**Paginated Endpoints:**
- `GET /api/movements` - Supports `skip`, `limit`, `type`, `status` params
- `GET /api/movements/overview` - Supports `skip`, `limit` params
- `GET /api/movements/signals` - Supports `skip`, `limit` params

**Frontend Pattern:**
- DataGrid uses `paginationMode="server"` with `rowCount` from API response
- Filters (type, status) passed to API to filter server-side
- Page resets to 0 when filters change
- Query keys include pagination params for proper cache invalidation

### Paired Fields Pattern
Movement fields use a paired pattern for system vs. manual values:
- `*_default`: System/import values
- `*_manual`: User overrides
- Computed property returns `manual ?? default`

Example: `tank_id_default`, `tank_id_manual` → `tank_id` (computed)

## Data Flow
1. UI calls REST endpoints via `src/lib/api.ts`
2. Routers delegate to service classes for business logic
3. Services use `CosmosStorage` for persistence
4. Tank levels computed from movements via `calculate_tank_level()`

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `COSMOS_CONNECTION_STRING` | Azure Cosmos DB connection |
| `COSMOS_DATABASE_NAME` | Database name (default: "tank-management") |
| `OPENAI_API_KEY` | OpenAI API for PDF extraction |
| `AZURE_BLOB_CONNECTION_STRING` | Azure Blob Storage for PDFs |
| `AZURE_BLOB_CONTAINER_NAME` | Blob container (default: "pdf-imports") |
| `ALLOWED_ORIGINS` | CORS origins (default: "http://localhost:3000") |

## Integration Notes
- API contracts defined in `frontend/src/lib/api.ts` - update both sides in sync
- Tank levels are derived (initial + movements), not stored directly
- Transfer movements stored as individual records per target tank
- Adjustments complete immediately with signed actual volumes for gains/losses
- For auth integration, add middleware in `backend/main.py` and pass headers via `fetchAPI`
