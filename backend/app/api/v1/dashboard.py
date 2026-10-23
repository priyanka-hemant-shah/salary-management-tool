"""
Dashboard API — v1

Endpoints:
----------
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/salary-by-country
GET /api/v1/dashboard/salary-trend
GET /api/v1/dashboard/recent-changes
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RecentChangesResponse,
    SalaryByCountryResponse,
    SalaryTrendResponse,
)
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get dashboard summary KPIs")
async def get_dashboard_summary(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    """Return headcount, total spend, average salary, country count, and paid ratio for a given month."""
    return await AnalyticsService.get_dashboard_summary(db=db, month_str=month, currency=currency)


@router.get("/salary-by-country", response_model=SalaryByCountryResponse, summary="Get salary breakdown by country")
async def get_salary_by_country(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> SalaryByCountryResponse:
    """Return country-level salary totals and percentage shares for donut/pie charts."""
    return await AnalyticsService.get_salary_by_country(db=db, month_str=month, currency=currency)


@router.get("/salary-trend", response_model=SalaryTrendResponse, summary="Get 12-month salary trend")
async def get_salary_trend(
    months: int = Query(12, ge=1, le=36, description="Number of past months to include"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> SalaryTrendResponse:
    """Return monthly aggregated salary trend line data."""
    return await AnalyticsService.get_salary_trend(db=db, months_count=months, currency=currency)


@router.get("/recent-changes", response_model=RecentChangesResponse, summary="Get recent salary and employee activities")
async def get_recent_changes(
    limit: int = Query(10, ge=1, le=50, description="Max number of items to return"),
    db: AsyncSession = Depends(get_db),
) -> RecentChangesResponse:
    """Return latest employee salary updates and recent records."""
    return await AnalyticsService.get_recent_changes(db=db, limit=limit)

