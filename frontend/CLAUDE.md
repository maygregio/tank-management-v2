# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

## Architecture

Next.js 16 App Router frontend with Material UI and React Query. Connects to a FastAPI backend at localhost:8000.

### Tech Stack

- **Next.js 16** with App Router (`src/app/`)
- **Material UI v7** for components
- **TanStack React Query** for server state management
- **TypeScript** throughout

### Key Patterns

**Data Fetching**: All API calls use React Query hooks. Query keys follow the pattern `['entity']` or `['entity', id]`. The API client is in `src/lib/api.ts` with typed functions grouped by entity (`sitesApi`, `tanksApi`, `movementsApi`, `dashboardApi`).

**Providers**: `src/components/Providers.tsx` wraps the app with QueryClientProvider and MUI ThemeProvider. Query client has 5s stale time and disabled refetch on window focus.

**Layout**: `Navigation.tsx` provides a responsive drawer layout. Pages render inside the main content area.

### Routes

- `/` - Dashboard with stats and tank cards grouped by site
- `/sites` - CRUD for sites
- `/tanks` - Tank list and creation
- `/tanks/[id]` - Tank detail with movement history
- `/movements` - Schedule and complete movements
- `/adjustments` - Physical reading adjustments

### Types

`src/lib/types.ts` mirrors the backend Pydantic models. Key types:

- `TankWithLevel` - Tank with calculated `current_level`, `level_percentage`, `is_low`
- `Movement` - Has `actual_volume: number | null` (null = pending, set = completed)

### Backend Connection

API base URL is hardcoded to `http://localhost:8000/api` in `src/lib/api.ts`. The backend must be running for the frontend to function.

# MCP Gemini Design

**Gemini is your frontend developer.** For all UI/design work, use this MCP. Tool descriptions contain all necessary instructions.

## Before writing any UI code, ask yourself:

- Is it a NEW visual component (popup, card, section, etc.)? → `snippet_frontend` or `create_frontend`
- Is it a REDESIGN of an existing element? → `modify_frontend`
- Is it just text/logic, or a trivial change? → Do it yourself

## Critical rules:

1. **If UI already exists and you need to redesign/restyle it** → use `modify_frontend`, NOT snippet_frontend.

2. **Tasks can be mixed** (logic + UI). Mentally separate them. Do the logic yourself, delegate the UI to Gemini.
