# Migration Instructions (Tank Management v2)

This document is for an AI agent embedding this solution (backend + frontend) into a larger system. The top priority is to follow the *new solution* patterns:
- Backend: keep the existing endpoint structure (without a `/api` base) and preserve request/response shapes.
- Backend: replace Cosmos access with the host system's shared Cosmos library (do not use `backend/services/storage.py`).
- Frontend: keep shared styles + components (MUI theme + `src/components`) and use the shared API client (`frontend/src/lib/api.ts`).

## Architecture overview
- Backend: FastAPI app in `backend/main.py`, routers under `backend/routers`, services under `backend/services`, models under `backend/models`.
- Frontend: Next.js App Router in `frontend/src/app`, shared UI + tokens in `frontend/src/components`, `frontend/src/lib/theme.ts`, and `frontend/src/app/globals.css`.
- Data: Cosmos DB is the primary store; Azure Blob Storage + OpenAI used for PDF extraction in imports flow.

## Backend layout and patterns
- Entry point: `backend/main.py` mounts routers (no `/api` base in the host system).
- Routers (HTTP layer): `backend/routers/*.py` should be thin; they call services or storage.
- Storage: `backend/services/storage.py` provides `CosmosDBClient` and `CosmosStorage`. Use this layer instead of direct Cosmos calls.
- Models: `backend/models/schemas.py`, plus domain models in `backend/models/*.py`.

### Endpoint map (keep these shapes)
Base: `/` (no `/api` prefix in the host system)

**Tanks**
- `GET /tanks` (optional `location` query)
- `GET /tanks/dashboard`
- `GET /tanks/{tank_id}`
- `GET /tanks/{tank_id}/history`
- `POST /tanks`
- `PUT /tanks/{tank_id}`
- `DELETE /tanks/{tank_id}`

**Movements**
- `GET /movements` (optional `tank_id`, `type`, `status` query)
- `POST /movements`
- `POST /movements/transfer`
- `PUT /movements/{movement_id}`
- `PUT /movements/{movement_id}/complete`
- `POST /movements/adjustment`
- `DELETE /movements/{movement_id}`

**Signals**
- `GET /movements/signals`
- `POST /movements/signals/upload` (multipart file)
- `PUT /movements/{movement_id}/assign`
- `PUT /movements/{movement_id}/trade`

**Imports (PDF)**
- `POST /imports/extract` (multipart files)
- `POST /imports/confirm`

**COA**
- `GET /coa`
- `GET /coa/{coa_id}`
- `GET /coa/signal/{signal_id}`
- `POST /coa/upload` (multipart file, optional `signal_id` query)
- `POST /coa/{coa_id}/link`
- `DELETE /coa/{coa_id}`

**Health**
- `GET /health`

### Cosmos usage pattern (must follow host system)
- Replace `CosmosStorage` with the host system's shared Cosmos library.
- Keep container names consistent unless the host system standardizes them: `tanks`, `movements`, `certificates_of_analysis`.
- Use the host system's serialization and access patterns as the single source of truth.

## Frontend layout and patterns
- App Router pages in `frontend/src/app`.
- Shared API client in `frontend/src/lib/api.ts` (do not call `fetch` directly in pages).
- Shared types in `frontend/src/lib/types.ts`.
- Shared theme + tokens in `frontend/src/lib/theme.ts` and `frontend/src/app/globals.css`.
- Shared components in `frontend/src/components` (cards, dialogs, charts, navigation, etc.).

### App routes (pages)
- `/` dashboard: `frontend/src/app/page.tsx`
- `/tanks`: `frontend/src/app/tanks/page.tsx`
- `/tanks/[id]`: `frontend/src/app/tanks/[id]/page.tsx`
- `/movements`: `frontend/src/app/movements/page.tsx`
- `/adjustments`: `frontend/src/app/adjustments/page.tsx`
- `/signals`: `frontend/src/app/signals/page.tsx`
- `/imports`: `frontend/src/app/imports/page.tsx`
- `/coa`: `frontend/src/app/coa/page.tsx`

### Routing cleanup
- The host system does not need Next.js `loading.tsx` or `error.tsx` pages. Omit them during migration.

### Frontend API mapping (must change)
- Do not use `fetch` directly in pages; for the host system, use shared `fetchData` (GET) and `postData` (POST) helpers.
- Update `frontend/src/lib/api.ts` to route through `fetchData`/`postData` and remove the `/api` base prefix.
- Explore host documentation during migration to use the correct shared helper signatures (auth headers are required).

## Integration reminders for the embedding agent
- Do not invent new API paths; the host solution uses no `/api` prefix.
- Keep the Cosmos storage access centralized via the host shared Cosmos library (do not bypass it).
- Keep frontend styling consistent by reusing the MUI theme and shared components.
- If the host platform has auth, add middleware to `backend/main.py` and pass auth headers through `fetchData`/`postData` in `frontend/src/lib/api.ts`.
- Update both backend and frontend in lockstep if a contract needs to change.

## Open questions for the host integration
- What is the exact base path (if any) for the host system?
- What are the canonical container names in the shared Cosmos library?
- What are the required auth headers and helper signatures for `fetchData`/`postData`?
