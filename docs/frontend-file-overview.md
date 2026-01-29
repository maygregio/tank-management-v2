# Frontend File Overview

This document describes each file in the `frontend/` directory and its purpose in the Tank Management frontend application.

---

## Configuration Files

### `package.json`
**Purpose:** Project dependencies and npm scripts.

Key dependencies:
- `next` (16.x) - React framework with App Router
- `react` / `react-dom` (19.x) - React library
- `@mui/material` (7.x) - Material UI component library
- `@mui/x-data-grid` - Data grid component for tables
- `@tanstack/react-query` - Server state management
- `dayjs` - Lightweight date manipulation library
- `highcharts` / `highcharts-react-official` - Charting library
- `notistack` - Toast notifications

### `next.config.ts`
**Purpose:** Next.js configuration (minimal, default settings).

### `tsconfig.json`
**Purpose:** TypeScript configuration with path alias `@/*` mapping to `src/*`.

---

## Library Files (`src/lib/`)

### `api.ts`
**Purpose:** API client with typed functions for all backend endpoints.

**Base URL:** `http://localhost:8000/api`

**API groups:**
- `tanksApi` - Tank CRUD operations
- `movementsApi` - Movement operations and signal workflow
- `coaApi` - Certificate of Analysis operations
- `adjustmentsApi` - Monthly adjustment imports
- `importsApi` - PDF movement imports
- `overviewApi` - Overview grid data
- `terminalsApi` - Terminal aggregation data

**Endpoints called:**
| API Function | HTTP Method | Endpoint |
|--------------|-------------|----------|
| `tanksApi.getAll()` | GET | `/tanks` |
| `tanksApi.getById(id)` | GET | `/tanks/{id}` |
| `tanksApi.getHistory(id)` | GET | `/tanks/{id}/history` |
| `tanksApi.create(data)` | POST | `/tanks` |
| `tanksApi.update(id, data)` | PUT | `/tanks/{id}` |
| `tanksApi.delete(id)` | DELETE | `/tanks/{id}` |
| `movementsApi.getAll(params)` | GET | `/movements` (paginated, with type/status/source filters) |
| `movementsApi.getSignals(params)` | GET | `/movements/signals` (paginated) |
| `movementsApi.create(data)` | POST | `/movements` |
| `movementsApi.createTransfer(data)` | POST | `/movements/transfer` |
| `movementsApi.createAdjustment(data)` | POST | `/movements/adjustment` |
| `movementsApi.update(id, data)` | PUT | `/movements/{id}` |
| `movementsApi.complete(id, data)` | PUT | `/movements/{id}/complete` |
| `movementsApi.delete(id)` | DELETE | `/movements/{id}` |
| `movementsApi.uploadSignals(file)` | POST | `/movements/signals/upload` |
| `movementsApi.assignSignal(id, data)` | PUT | `/movements/signals/{id}/assign` |
| `movementsApi.updateTradeInfo(id, data)` | PUT | `/movements/signals/{id}/trade` |
| `coaApi.getAll()` | GET | `/coa` |
| `coaApi.upload(file, signalId?)` | POST | `/coa/upload` |
| `coaApi.link(id, signalId)` | POST | `/coa/{id}/link` |
| `coaApi.delete(id)` | DELETE | `/coa/{id}` |
| `adjustmentsApi.extractFromPDFs(files)` | POST | `/adjustments/extract` |
| `adjustmentsApi.confirmImport(data)` | POST | `/adjustments/confirm` |
| `adjustmentsApi.getPdfUrl(blobName)` | GET | `/adjustments/pdf/{blobName}` |
| `importsApi.extractFromPDFs(files)` | POST | `/imports/extract` |
| `importsApi.confirmImport(data)` | POST | `/imports/confirm` |
| `overviewApi.getAll(params)` | GET | `/movements/overview` (paginated) |
| `terminalsApi.getAll()` | GET | `/terminals` |
| `terminalsApi.getLocations()` | GET | `/terminals/locations` |
| `terminalsApi.getAggregatedHistory(location, start, end)` | GET | `/terminals/{location}/history` |

### `types.ts`
**Purpose:** TypeScript interfaces mirroring backend Pydantic models.

Key types:
- `MovementSource` - Source tracking type (`'manual' | 'pdf_import' | 'signal' | 'adjustment'`)
- `TankWithLevel` - Tank with calculated current_level, level_percentage
- `Movement` - Movement with paired fields pattern (*_default/*_manual) and `source` field
- `MovementCreate`, `MovementUpdate`, `MovementComplete` - Movement input types
- `TransferCreate`, `TransferTargetCreate` - Transfer operations
- `SignalAssignment`, `TradeInfoUpdate` - Signal workflow types
- `CertificateOfAnalysis`, `COAWithSignal` - COA types
- `MovementWithCOA` - Movement joined with COA properties
- `PDFExtractionResult`, `PDFMovementWithMatches` - PDF import types
- `AdjustmentExtractionResult`, `AdjustmentReadingWithMatches` - Adjustment types
- `MovementSummaryStats` - Summary statistics for movements page
- `PaginatedResponse<T>` - Generic paginated response with `items`, `total`, `skip`, `limit`
- `TerminalSummary` - Terminal summary (location, tank_count, capacity, level, utilization)
- `TerminalDailyAggregation` - Daily aggregated terminal data (level, movements by type)

### `constants.ts`
**Purpose:** Shared constants, labels, colors, and style objects.

**Timing Constants:**
- `DEFAULT_POLLING_INTERVAL_MS` - 30 seconds
- `DEBOUNCE_DELAY_MS` - 500ms for search inputs
- `CARD_HOVER_TRANSITION_SECONDS` - 0.35s
- `TABLE_ROW_TRANSITION_SECONDS` - 0.25s

**Label/Color Mappings:**
- `feedstockTypeLabels` - Labels for feedstock types
- `movementTypeLabels` - Labels for movement types (LOAD, DISCHARGE, etc.)
- `movementTypeColors`, `movementTypeChipColors` - Color mappings

**Style Objects:**
- `styles` - Shared style objects (cardGradient, dialogPaper, summaryCard, tableHeadRow, alertError, alertSuccess)
- `dataGridSx` - Base DataGrid styling
- `dataGridWithRowStylesSx` - DataGrid with row hover and alternating rows
- `buttonStyles` - Centralized button styles (primary, success, warning, danger, secondary, purple)

**Utilities:**
- `openPdfInNewTab(pdfUrl, getPdfUrlFn)` - Extracts blob name from Azure URL and opens PDF in new tab

### `dateUtils.ts`
**Purpose:** Date formatting and manipulation utilities using dayjs.

Functions:
- `formatDate(value)` - Formats date strings for display (M/D/YYYY format)
- `getLocalToday()` - Gets today's date as YYYY-MM-DD in local timezone
- `toLocalDateString(value)` - Extracts date portion (YYYY-MM-DD) from any date string
- `isFutureDate(value)` - Checks if a date is after today
- `isSameDay(a, b)` - Checks if two date strings represent the same day
- `isWithinRange(value, start, end)` - Checks if a date is within a range (inclusive)
- `compareDates(a, b)` - Compares two date strings for sorting

Note: Uses dayjs for consistent timezone handling, avoiding issues with native `Date` parsing of date-only strings as UTC.

### `theme.ts`
**Purpose:** Material UI theme configuration.

Dark theme with:
- Custom color palette (cyan accent, dark backgrounds)
- Typography settings (Inter font)
- Component overrides for consistent styling

### `validation.ts`
**Purpose:** Form validation utilities (if present).

### `export.ts`
**Purpose:** Data export utilities (if present).

### `columnProfiles.ts`
**Purpose:** Column visibility profiles for the Overview grid.

Profiles:
- `All` - All 18 columns visible
- `Scheduler` - signal_id, load tank, volume, dates, equipment, discharge tank, notes
- `Trader` - signal_id, nom_key, volume, date, diffs, strategy, trade_id, destination
- `Quality` - signal_id, nom_key, COA properties (API gravity, sulfur, viscosity, ash)
- `Custom` - User-customized visibility

Functions:
- `getProfileVisibilityModel(profile)` - Get visibility model for a profile
- `detectProfile(model)` - Detect which profile matches current visibility

### `columnPreferences.ts`
**Purpose:** localStorage persistence for column preferences.

Functions:
- `saveColumnPreferences(preferences)` - Save to localStorage
- `loadColumnPreferences()` - Load from localStorage

### `movementSource.ts`
**Purpose:** Movement source utilities and type definitions.

Types:
- `MovementSourceFilter` - Union of `MovementSource | 'all'` for filter dropdowns

Constants:
- `movementSourceLabelMap` - Maps source to display label (manual→Manual, pdf_import→PDF, signal→Signal, adjustment→Adjustment)
- `movementSourceOptions` - Array of value/label pairs for select options

Functions:
- `normalizeMovementSource(source)` - Returns source or 'manual' as default

---

## Context (`src/contexts/`)

### `ToastContext.tsx`
**Purpose:** Toast notification context using notistack.

Provides:
- `success(message)` - Green success toast
- `error(message)` - Red error toast
- `warning(message)` - Yellow warning toast
- `info(message)` - Cyan info toast

---

## App Files (`src/app/`)

### `layout.tsx`
**Purpose:** Root layout wrapping all pages.

Imports:
- `Providers` component
- `Navigation` component
- Google Fonts (Inter)

### `globals.css`
**Purpose:** Global CSS with CSS custom properties.

Defines:
- Color variables (--color-accent-cyan, --glass-bg, --glass-border, etc.)
- Animation keyframes
- Base styling

### `page.tsx` (Dashboard `/`)
**Purpose:** Dashboard page showing tank overview grouped by location.

**Imports:**
- `@mui/material`: Box, Typography, CircularProgress
- `@tanstack/react-query`: useQuery
- `@/lib/api`: tanksApi
- `@/components/TankCard`
- `@/components/SectionHeader`

**API calls:**
- `tanksApi.getAll()` via React Query

**Dependencies (uses):**
- `TankCard` - Displays individual tank info
- `SectionHeader` - Section dividers

### `loading.tsx`
**Purpose:** Loading state for dashboard (skeleton loaders).

### `error.tsx`
**Purpose:** Error boundary UI for unhandled errors.

---

## Tanks Pages (`src/app/tanks/`)

### `page.tsx` (`/tanks`)
**Purpose:** Tank list with create/edit/delete functionality.

**Imports:**
- `@mui/material`: Box, Button, Card, Dialog, FormControl, etc.
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: tanksApi
- `@/lib/types`: Tank types
- `@/lib/constants`: feedstockTypeLabels, styles
- `@/components/TankLevelGauge`
- `@/components/ConfirmationDialog`
- `@/components/EmptyState`
- `@/contexts/ToastContext`

**API calls:**
- `tanksApi.getAll()`
- `tanksApi.create(data)`
- `tanksApi.update(id, data)`
- `tanksApi.delete(id)`

### `[id]/page.tsx` (`/tanks/[id]`)
**Purpose:** Tank detail page with movement history and activity chart.

**Imports:**
- `@mui/material`: Box, Button, Card, Typography, etc.
- `@tanstack/react-query`: useQuery
- `@/lib/api`: tanksApi
- `@/lib/dateUtils`: formatDate, compareDates, isWithinRange
- `@/components/TankLevelGauge`
- `@/components/MovementTypeChip`
- `@/components/MovementStatus`
- `@/components/charts/DynamicCharts`: DynamicTankActivityChart

**API calls:**
- `tanksApi.getById(id)`
- `tanksApi.getHistory(id)`

**Date Handling:**
- Uses `compareDates()` for sorting movement history
- Uses `isWithinRange()` for date range filtering

---

## Movements Page (`src/app/movements/`)

### `page.tsx` (`/movements`)
**Purpose:** Movement management with manual entry, PDF import, and data grid.

**Imports:**
- `@mui/material`: Box, Grid, IconButton, etc.
- `@mui/x-data-grid`: DataGrid, GridColDef, GridPaginationModel
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: tanksApi, movementsApi
- `@/lib/dateUtils`: formatDate, getLocalToday
- `@/components/movements/*`: ManualEntryForm, PdfImportForm, MovementsTableSection, MovementDialogs, MovementSummaryCards, SourceBadge
- `@/components/movements/useMovementsViewModel`
- `@/contexts/ToastContext`

**API calls:**
- `tanksApi.getAll()`
- `movementsApi.getAll({ type, status, source, skip, limit })` - Server-side pagination and filtering
- `movementsApi.create(data)`
- `movementsApi.createTransfer(data)`
- `movementsApi.update(id, data)`
- `movementsApi.complete(id, data)`
- `movementsApi.delete(id)`

**Server-Side Pagination:**
- Uses `paginationModel` state (`{ page, pageSize }`)
- Query key includes pagination params: `['movements', page, pageSize, apiFilters]`
- Filters (type, status, source) passed to API for server-side filtering
- Page resets to 0 when filters change

**Date Handling:**
- Uses `getLocalToday()` for default scheduled date in forms

---

## Signals Page (`src/app/signals/`)

### `page.tsx` (`/signals`)
**Purpose:** Signal workflow management (upload, assign, trade info).

**Imports:**
- `@mui/material`: Box, Button, Card, Chip, Dialog, Table, etc.
- `@mui/x-data-grid`: DataGrid, GridPaginationModel
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: movementsApi, tanksApi
- `@/lib/types`: Signal types
- `@/lib/constants`: styles
- `@/lib/dateUtils`: formatDate
- `@/components/SectionHeader`
- `@/components/EmptyState`
- `@/contexts/ToastContext`

**API calls:**
- `movementsApi.getSignals({ skip, limit })` - Server-side pagination
- `movementsApi.uploadSignals(file)`
- `movementsApi.assignSignal(id, data)`
- `movementsApi.updateTradeInfo(id, data)`
- `tanksApi.getAll()`

**Server-Side Pagination:**
- Uses `paginationModel` state (`{ page, pageSize }`)
- Query key includes pagination params: `['signals', page, pageSize]`
- DataGrid configured with `paginationMode="server"` and `rowCount`

---

## Overview Page (`src/app/overview/`)

### `page.tsx` (`/overview`)
**Purpose:** Overview grid page wrapper.

**Imports:**
- `@mui/material`: Box
- `@/components/overview/OverviewGrid`

**Dependencies (uses):**
- `OverviewGrid` - Main editable DataGrid component

---

## COA Page (`src/app/coa/`)

### `page.tsx` (`/coa`)
**Purpose:** Certificate of Analysis management.

**Imports:**
- `@mui/material`: Box, Button, Card, Chip, IconButton, Table, etc.
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: coaApi, movementsApi
- `@/lib/types`: COA types
- `@/lib/dateUtils`: formatDate
- `@/components/COAUploadDialog`
- `@/components/COAPropertiesDialog`
- `@/components/COALinkDialog`
- `@/components/ConfirmationDialog`
- `@/components/SectionHeader`
- `@/components/EmptyState`
- `@/contexts/ToastContext`

**API calls:**
- `coaApi.getAll()`
- `coaApi.upload(file, signalId)`
- `coaApi.link(id, signalId)`
- `coaApi.delete(id)`
- `movementsApi.getAll()`

---

## Terminals Page (`src/app/terminals/`)

### `page.tsx` (`/terminals`)
**Purpose:** Terminal aggregation page showing combined tank levels and movements for a location.

**Imports:**
- `@mui/material`: Box, Button, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography
- `@tanstack/react-query`: useQuery
- `dayjs` - Date manipulation
- `@/lib/api`: terminalsApi
- `@/lib/types`: TerminalSummary, TerminalDailyAggregation
- `@/components/charts/DynamicCharts`: DynamicTankActivityChart
- `@/components/SectionHeader`
- `@/components/EmptyState`

**API calls:**
- `terminalsApi.getAll()`
- `terminalsApi.getAggregatedHistory(location, startDate, endDate)`

**Features:**
- Terminal selector dropdown with auto-selection of first terminal
- Date range filter (default: last 30 days)
- Summary cards: tank count, total capacity, current level, utilization percentage
- Dual-axis chart showing combined tank levels and net movements over time
- Daily breakdown table with movement details (loads, discharges, transfers in/out, adjustments)

---

## Adjustments Page (`src/app/adjustments/`)

### `page.tsx` (`/adjustments`)
**Purpose:** Monthly adjustment imports from physical inspection PDFs.

**Imports:**
- `@mui/material`: Box, Button, Card, Step, Stepper, Table, etc.
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: adjustmentsApi, tanksApi, movementsApi
- `@/lib/types`: Adjustment types
- `@/lib/constants`: styles
- `@/components/adjustments/AdjustmentReviewRow`
- `@/components/SectionHeader`
- `@/contexts/ToastContext`

**API calls:**
- `adjustmentsApi.extractFromPDFs(files)`
- `adjustmentsApi.confirmImport(data)`
- `adjustmentsApi.getPdfUrl(blobName)`
- `tanksApi.getAll()`
- `movementsApi.getAll()`

---

## Shared Components (`src/components/`)

### `Providers.tsx`
**Purpose:** Root provider wrapper.

**Wraps with:**
- `QueryClientProvider` (React Query with 5s stale time)
- `ThemeProvider` (MUI theme)
- `SnackbarProvider` (notistack)
- `ToastProvider` (custom context)
- `CssBaseline` (MUI reset)

**Imports:**
- `@mui/material/styles`: ThemeProvider
- `@tanstack/react-query`: QueryClient, QueryClientProvider
- `notistack`: SnackbarProvider
- `@/contexts/ToastContext`: ToastProvider
- `@/lib/theme`

### `Navigation.tsx`
**Purpose:** App shell with header and tab navigation.

**Imports:**
- `next/navigation`: usePathname
- `next/link`: Link
- `@mui/material`: AppBar, Box, Toolbar, Typography
- `@mui/icons-material`: Various icons

**Navigation items:**
- Tanks, Terminals, Movements, Overview, Signals, COA, Adjustments

### `TankCard.tsx`
**Purpose:** Tank display card with level gauge.

**Imports:**
- `next/link`: Link
- `@mui/material`: Card, CardActionArea, CardContent, Typography, Box
- `@/components/TankLevelGauge`
- `@/lib/constants`: feedstockTypeLabels, styles
- `@/lib/types`: TankWithLevel

### `TankLevelGauge.tsx`
**Purpose:** Horizontal progress bar showing tank fill level.

**Imports:**
- `@mui/material`: Box, Typography

### `MovementTypeChip.tsx`
**Purpose:** Colored chip displaying movement type (LOAD, DISCHARGE, etc.).

**Imports:**
- `@mui/material`: Chip
- `@/lib/constants`: movementTypeLabels, movementTypeColors, movementTypeChipColors
- `@/lib/types`: MovementType

### `MovementStatus.tsx`
**Purpose:** Status indicator (Pending/Complete) with colored dot.

**Imports:**
- `@mui/material`: Box, Typography

### `ErrorBoundary.tsx`
**Purpose:** React error boundary with retry/reload UI.

**Imports:**
- `react`: Component
- `@mui/material`: Box, Typography, Button
- `@mui/icons-material`: RefreshIcon

### `EmptyState.tsx`
**Purpose:** Empty state placeholder with icon, message, and optional action.

**Imports:**
- `@mui/material`: Box, Typography, Button
- `next/link`: Link

### `SectionHeader.tsx`
**Purpose:** Section title with horizontal line.

**Imports:**
- `@mui/material`: Box, Typography

### `GlassDialog.tsx`
**Purpose:** Styled dialog with glass morphism effect.

**Imports:**
- `@mui/material`: Dialog, DialogTitle, DialogContent, DialogActions, Typography
- `@/lib/constants`: styles

### `ConfirmationDialog.tsx`
**Purpose:** Confirmation dialog with warning/danger/info variants.

**Imports:**
- `@mui/material`: Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography
- `@mui/icons-material`: WarningIcon, DeleteIcon, CheckCircleIcon

### `DialogScaffold.tsx`
**Purpose:** Reusable dialog component with consistent glass-effect styling.

Provides a standardized dialog structure with:
- Glass morphism paper styling (from `styles.dialogPaper`)
- Customizable title with cyan accent color
- Bordered content and actions sections
- Support for custom sx props on all sections

**Props:**
- `title` - Dialog title (string or ReactNode)
- `titleColor` - Title color (default: cyan)
- `titleSx`, `contentSx`, `actionsSx` - Custom styling for sections
- `children` - Dialog content
- `actions` - Action buttons

**Imports:**
- `@mui/material`: Dialog, DialogTitle, DialogContent, DialogActions, Typography
- `@/lib/constants`: styles

### `StyledDataGrid.tsx`
**Purpose:** Styled DataGrid wrapper with variant support.

Variants:
- `default` - Basic DataGrid styling
- `striped` - Alternating row colors
- `movement` - Movement-specific styling with pending/complete/future row classes
- `overview` - Overview grid styling with editable cell highlights

**Imports:**
- `@mui/x-data-grid`: DataGrid
- `@mui/material/styles`: alpha
- `@/lib/constants`: dataGridSx, dataGridWithRowStylesSx

---

## COA Components

### `COAPropertiesDialog.tsx`
**Purpose:** Dialog showing COA chemical properties.

**Imports:**
- `@mui/material`: Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, IconButton
- `@mui/icons-material`: PictureAsPdfIcon, OpenInNewIcon
- `@/lib/types`: COAWithSignal
- `@/lib/dateUtils`: formatDate

### `COAUploadDialog.tsx`
**Purpose:** Dialog for uploading COA PDF with optional signal linking.

**Imports:**
- `@mui/material`: Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert
- `@mui/icons-material`: CloudUploadIcon, PictureAsPdfIcon
- `@/lib/types`: Movement

### `COALinkDialog.tsx`
**Purpose:** Dialog for manually linking COA to a signal.

**Imports:**
- `@mui/material`: Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress
- `@/lib/types`: COAWithSignal, Movement

---

## Movement Components (`src/components/movements/`)

### `ManualEntryForm.tsx`
**Purpose:** Form for creating manual movements (load/discharge/transfer/adjustment).

**Imports:**
- `@mui/material`: Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Typography
- `@/lib/constants`: styles
- `@/lib/types`: MovementCreate, MovementType, TransferTargetCreate, TankWithLevel

### `PdfImportForm.tsx`
**Purpose:** Multi-step PDF import workflow (upload → review → confirm).

**Imports:**
- `@mui/material`: Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControl, MenuItem, Select, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Alert
- `@mui/icons-material`: CheckCircleIcon, CloudUploadIcon, ErrorOutlineIcon, UploadFileIcon
- `@tanstack/react-query`: useMutation, useQueryClient
- `@/lib/api`: importsApi
- `@/lib/constants`: styles, movementTypeLabels, movementTypeColors, movementTypeChipColors
- `@/lib/types`: MovementType, TankWithLevel, PDFExtractionResult, PDFMovementWithMatches, PDFImportConfirmItem

### `MovementsTableSection.tsx`
**Purpose:** DataGrid section with filters and bulk actions, server-side pagination.

**Imports:**
- `@mui/material/styles`: alpha
- `@mui/material`: Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography
- `@mui/x-data-grid`: DataGrid, GridColDef, GridRowSelectionModel, GridPaginationModel
- `@/lib/constants`: dataGridSx
- `@/components/SectionHeader`
- `@/lib/types`: MovementType, MovementUpdate
- `./useMovementsViewModel`: MovementGridRowExtended, MovementSource

**Server-Side Pagination Props:**
- `paginationModel`, `onPaginationModelChange` - Pagination state
- `rowCount` - Total count from API for server-side pagination
- `loading` - Loading state for DataGrid

### `MovementDialogs.tsx`
**Purpose:** Complete and Edit dialogs for movements.

**Exports:**
- `CompleteDialog` - Record actual volume
- `EditDialog` - Edit pending movement details

**Imports:**
- `@mui/material`: Box, Button, TextField, Typography
- `@/components/GlassDialog`
- `@/lib/types`: Movement, MovementUpdate, TankWithLevel

### `MovementSummaryCards.tsx`
**Purpose:** Summary statistics cards (Scheduled Today, Pending, Completed, Total).

**Imports:**
- `@mui/material`: Box, Typography
- `@/lib/constants`: styles
- `@/lib/types`: MovementSummaryStats

### `SourceBadge.tsx`
**Purpose:** Badge showing movement source (Manual/PDF/Signal/Adjustment).

**Imports:**
- `@mui/material`: Chip
- `@/lib/types`: MovementSource
- `@/lib/movementSource`: movementSourceLabelMap

### `useMovementsViewModel.ts`
**Purpose:** ViewModel hook for movements page logic.

**Exports:**
- `MovementSource` type (display type: `'manual' | 'pdf'`)
- `MovementGridRowExtended` interface
- `useMovementsViewModel()` hook

**Provides:**
- `tankMap` - Map of tank IDs to tanks
- `targetTanks` - Available target tanks for transfers
- `availableTargetTanks` - Targets not already selected
- `totalTransferVolume` - Sum of transfer target volumes
- `remainingTransferVolume` - Source tank level minus transfers
- `summaryStats` - Movement statistics (uses `getLocalToday()` for "scheduled today" count)
- `rows` - Filtered/transformed grid rows (uses `isFutureDate()` for future detection)

**Source Detection:**
- Uses explicit `movement.source` field from backend (not notes text)
- Maps backend source (`'pdf_import'`) to display source (`'pdf'`)

---

## Overview Components (`src/components/overview/`)

### `OverviewGrid.tsx`
**Purpose:** Main editable DataGrid for overview page.

**Imports:**
- `@mui/material`: Box, CircularProgress, Typography
- `@mui/x-data-grid`: DataGrid, GridColDef, GridColumnVisibilityModel, GridPaginationModel
- `@tanstack/react-query`: useQuery, useMutation, useQueryClient
- `@/lib/api`: overviewApi, movementsApi, tanksApi
- `@/lib/dateUtils`: formatDate
- `@/contexts/ToastContext`
- `@/lib/types`: MovementWithCOA, MovementUpdate
- `@/lib/columnProfiles`: ProfileName, getProfileVisibilityModel, detectProfile
- `@/lib/columnPreferences`: saveColumnPreferences, loadColumnPreferences
- `./ProfileSelector`

**API calls:**
- `overviewApi.getAll({ skip, limit })` - Server-side pagination
- `tanksApi.getAll()`
- `movementsApi.update(id, data)`

**Server-Side Pagination:**
- Uses `paginationModel` state (`{ page, pageSize }`)
- Query key includes pagination params: `['overview', page, pageSize]`
- DataGrid configured with `paginationMode="server"` and `rowCount`

**Editable fields:**
- notes, expected_volume, scheduled_date, base_diff, quality_adj_diff, equipment, tank_id, discharge_date, strategy, trade_number, destination

### `ProfileSelector.tsx`
**Purpose:** Dropdown for selecting column visibility profile.

**Imports:**
- `@mui/material`: FormControl, InputLabel, MenuItem, Select
- `@/lib/columnProfiles`: ProfileName

---

## Adjustment Components (`src/components/adjustments/`)

### `AdjustmentReviewRow.tsx`
**Purpose:** Table row for reviewing extracted adjustment readings.

**Imports:**
- `@mui/material`: Box, Checkbox, Chip, FormControl, MenuItem, Select, TableCell, TableRow, Typography
- `@mui/icons-material`: CheckCircleIcon, ErrorOutlineIcon
- `@/lib/constants`: styles
- `@/lib/types`: AdjustmentReadingWithMatches, TankWithLevel

---

## Chart Components (`src/components/charts/`)

### `BaseChart.tsx`
**Purpose:** Base Highcharts wrapper with theme styling.

**Imports:**
- `highcharts/highstock`: Highcharts
- `highcharts-react-official`: HighchartsReact
- `@mui/material/styles`: useTheme

### `AreaChart.tsx`
**Purpose:** Area/spline chart component.

**Imports:**
- `./BaseChart`
- `highcharts/highstock`: Highcharts

### `TankActivityChart.tsx`
**Purpose:** Dual-axis chart showing tank level and movements.

**Imports:**
- `./BaseChart`
- `highcharts/highstock`: Highcharts

### `DynamicCharts.tsx`
**Purpose:** Dynamic imports for chart components (code splitting).

**Exports:**
- `DynamicBaseChart`
- `DynamicTankActivityChart`
- `DynamicAreaChart`

**Imports:**
- `next/dynamic`
- `@mui/material`: Box, CircularProgress

---

## Skeleton Components (`src/components/skeletons/`)

### `StatCardSkeleton.tsx`
**Purpose:** Loading skeleton for stat cards.

**Imports:**
- `@mui/material`: Card, CardContent, Skeleton

---

## Component Dependency Graph

```
App Layout
└── Providers
    ├── QueryClientProvider
    ├── ThemeProvider
    ├── SnackbarProvider
    └── ToastProvider
        └── Navigation
            └── Page Content

Dashboard (/)
├── TankCard
│   └── TankLevelGauge
└── SectionHeader

Tank Detail (/tanks/[id])
├── TankLevelGauge
├── MovementTypeChip
├── MovementStatus
└── DynamicTankActivityChart
    └── BaseChart

Movements (/movements)
├── ManualEntryForm
├── PdfImportForm
├── MovementsTableSection
│   ├── SectionHeader
│   └── SourceBadge
├── MovementDialogs (CompleteDialog, EditDialog)
│   └── GlassDialog
├── MovementSummaryCards
└── useMovementsViewModel (hook)

Signals (/signals)
├── SectionHeader
└── EmptyState

Overview (/overview)
└── OverviewGrid
    └── ProfileSelector

COA (/coa)
├── COAUploadDialog
├── COAPropertiesDialog
├── COALinkDialog
├── ConfirmationDialog
├── SectionHeader
└── EmptyState

Adjustments (/adjustments)
├── AdjustmentReviewRow
└── SectionHeader

Terminals (/terminals)
├── DynamicTankActivityChart
│   └── BaseChart
├── SectionHeader
└── EmptyState
```

---

## Architecture Summary

```
frontend/
├── package.json              # Dependencies and scripts
├── next.config.ts            # Next.js config
├── tsconfig.json             # TypeScript config
│
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Dashboard
│   │   ├── globals.css       # Global styles
│   │   ├── tanks/            # Tank pages
│   │   ├── movements/        # Movements page
│   │   ├── signals/          # Signals page
│   │   ├── overview/         # Overview page
│   │   ├── coa/              # COA page
│   │   ├── adjustments/      # Adjustments page
│   │   └── terminals/        # Terminals aggregation page
│   │
│   ├── lib/                  # Shared utilities
│   │   ├── api.ts            # API client
│   │   ├── types.ts          # TypeScript types
│   │   ├── constants.ts      # Shared constants/styles/utilities
│   │   ├── theme.ts          # MUI theme
│   │   ├── dateUtils.ts      # Date utilities (dayjs-based)
│   │   ├── columnProfiles.ts # Overview column profiles
│   │   ├── columnPreferences.ts # localStorage persistence
│   │   └── movementSource.ts # Movement source utilities
│   │
│   ├── contexts/             # React contexts
│   │   └── ToastContext.tsx  # Toast notifications
│   │
│   └── components/           # Reusable components
│       ├── Providers.tsx     # Root providers
│       ├── Navigation.tsx    # App shell/nav
│       ├── TankCard.tsx      # Tank display card
│       ├── TankLevelGauge.tsx # Level progress bar
│       ├── MovementTypeChip.tsx # Type badge
│       ├── MovementStatus.tsx   # Status indicator
│       ├── ErrorBoundary.tsx    # Error boundary
│       ├── EmptyState.tsx       # Empty placeholder
│       ├── SectionHeader.tsx    # Section divider
│       ├── GlassDialog.tsx      # Styled dialog
│       ├── DialogScaffold.tsx   # Reusable dialog scaffold
│       ├── StyledDataGrid.tsx   # Styled DataGrid with variants
│       ├── ConfirmationDialog.tsx # Confirm dialog
│       ├── COA*.tsx             # COA dialogs
│       ├── movements/           # Movement components
│       ├── overview/            # Overview components
│       ├── adjustments/         # Adjustment components
│       ├── charts/              # Highcharts components
│       └── skeletons/           # Loading skeletons
```
