"""
ACME Salary Intelligence — FastAPI application entry point.

DEMO NOTICE: This application uses a demo login without real authentication.
It is not production-secure. Do not use real employee data in demo mode.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import router as v1_router
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    # Future: run startup checks here (e.g. DB connectivity ping)
    yield
    # Future: cleanup resources on shutdown


app = FastAPI(
    title="ACME Salary Intelligence API",
    description=(
        "Backend API for ACME Salary Intelligence. "
        "**DEMO MODE**: Authentication is simulated and not production-secure."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(v1_router)


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "ACME Salary Intelligence API", "docs": "/docs"}

