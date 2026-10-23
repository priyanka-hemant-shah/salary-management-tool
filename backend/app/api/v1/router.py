"""API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter

from app.api.v1.analytics import router as analytics_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.employees import router as employees_router

router = APIRouter(prefix="/api/v1")

router.include_router(employees_router)
router.include_router(dashboard_router)
router.include_router(analytics_router)
