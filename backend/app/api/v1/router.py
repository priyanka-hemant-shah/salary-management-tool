"""API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter

from app.api.v1.employees import router as employees_router

router = APIRouter(prefix="/api/v1")

router.include_router(employees_router)
