from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import tanks, movements, imports

app = FastAPI(
    title="Tank Management API",
    description="API for managing fuel tank levels through movements",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tanks.router, prefix="/api/tanks", tags=["Tanks"])
app.include_router(movements.router, prefix="/api/movements", tags=["Movements"])
app.include_router(imports.router, prefix="/api/imports", tags=["Imports"])


@app.get("/")
def root():
    return {"message": "Tank Management API", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
