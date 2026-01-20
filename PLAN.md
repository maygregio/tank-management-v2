# Plan: Combine Movements and PDF Import

## Goal

Unify the Movements page with the PDF import flow so users can create a movement either manually or from a PDF in one place.

## Scope

- Frontend: merge UI entry points and flows for manual movement creation and PDF-based creation.
- Backend: reuse existing endpoints; only add new wiring/validation if the combined UX needs it.
- Data model: no schema changes unless required to link a movement to a PDF source.

## Current Pages/Flows (To Consolidate)

- Movements page: manual entry and listing.
- PDF import page: upload, parse, review, and create movements from extracted data.

## Proposed UX

1. Single Movements hub page with two creation paths:
   - Manual entry form (existing fields/validation).
   - PDF upload/import panel (existing upload + preview/confirm).
2. Users can switch between paths without leaving the page.
3. After creation (manual or PDF), the movement appears in the same list with a clear source badge (Manual or PDF).
4. If PDF import supports multiple movements, show a staged preview list before confirmation.

## Detailed Work Plan

1. Inventory current Movements and PDF import components, routes, and API calls.
2. Decide which page becomes the canonical route (likely `/movements`); add redirects from the other route.
3. Create a shared container/layout that hosts:
   - Manual movement form component.
   - PDF import/upload component.
   - Unified movements list component.
4. Normalize success/error handling so both flows:
   - Surface validation errors in the same style.
   - Trigger a shared refresh of the movements list.
5. Add a "source" indicator in the movements list:
   - Manual: no extra metadata.
   - PDF: show a label or icon and allow viewing the PDF if a reference exists.
6. If necessary, extend backend responses to include a `source` or `import_id` so the UI can render the badge and PDF link.
7. Update tests or add lightweight coverage for:
   - Switching between creation paths.
   - Successful manual creation refresh.
   - Successful PDF import refresh and metadata display.

## Open Questions

1. Should the PDF import be collapsible/tabs, or two side-by-side panels on wide screens? - tabs
2. Do we need to keep a dedicated PDF import route for deep linking, or redirect entirely? - Just delete, no need to rediect.
3. What metadata is already available to identify PDF-derived movements (import id, file name, timestamp)?
4. Should the movements list allow filtering by source (Manual vs PDF)? - yes
