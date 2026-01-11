# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (using virtual environment)
python -m venv env
source env/bin/activate  # On macOS/Linux
pip install -r requirements.txt

# Run the development server
uvicorn main:app --reload --port 8000

# API documentation available at
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## Architecture

This is a FastAPI backend for a fuel tank management system, using Azure Cosmos DB for persistence.

### Core Domain Model

The system tracks fuel tanks across physical sites. Tank levels are **calculated from movements** rather than stored directly:

- **Sites** contain tanks
- **Tanks** have capacity, fuel type, and configurable low-level alert thresholds
- **Movements** are the source of truth for level changes: LOAD (fuel in), DISCHARGE (fuel out), TRANSFER (between tanks), ADJUSTMENT (sync with physical readings)

Tank levels are computed by `calculate_tank_level()` in `services/calculations.py`, which sums all movements starting from the tank's initial level.

### Layer Organization

- `main.py` - FastAPI app with CORS configured for localhost:3000 frontend
- `routers/` - API endpoints (sites, tanks, movements)
- `models/schemas.py` - All Pydantic models in one file
- `services/storage.py` - Generic `CosmosStorage[T]` class for Cosmos DB CRUD
- `services/calculations.py` - Tank level calculation logic

### Storage Pattern

`CosmosStorage` is a generic class that handles serialization and Cosmos DB operations. Each router instantiates storage for its entity:
```python
storage = CosmosStorage("container_name", ModelClass)
```

### Environment Variables

Required in `.env`:
- `COSMOS_CONNECTION_STRING` - Azure Cosmos DB connection string
- `COSMOS_DATABASE_NAME` - Database name (defaults to "tank-management")
