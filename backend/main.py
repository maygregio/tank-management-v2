import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routers import tanks, movements, signals, imports, coa

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# CORS configuration from environment
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info("Starting Tank Management API")
    logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")
    yield
    logger.info("Shutting down Tank Management API")


app = FastAPI(
    title="Tank Management API",
    description="API for managing feedstock tank levels through movements",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"}
    )

# Include routers
app.include_router(tanks.router, prefix="/api/tanks", tags=["Tanks"])
app.include_router(movements.router, prefix="/api/movements", tags=["Movements"])
app.include_router(signals.router, prefix="/api/movements/signals", tags=["Signals"])
app.include_router(imports.router, prefix="/api/imports", tags=["Imports"])
app.include_router(coa.router, prefix="/api/coa", tags=["Certificate of Analysis"])


@app.get("/")
def root():
    return {"message": "Tank Management API", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
