"""API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

# Health is mounted at app level, not under v1
# Feature routers will be added here in subsequent PRs

