"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Returns application health status.

    This endpoint is intentionally lightweight — it does not check the
    database connection so it can respond even during DB migrations.
    Use /health/db for a full connectivity check.
    """
    return {"status": "ok", "service": "acme-salary-intelligence"}

