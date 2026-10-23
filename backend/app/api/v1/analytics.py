"""
Analytics API — v1

Endpoints:
----------
GET /api/v1/analytics/overview
GET /api/v1/analytics/by-country
GET /api/v1/analytics/by-department
GET /api/v1/analytics/trends
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AnalyticsTrendsResponse,
    CountryAnalyticsResponse,
    DepartmentAnalyticsResponse,
)
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse, summary="Get salary analytics overview KPIs")
async def get_analytics_overview(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    country: Optional[str] = Query(None, description="Filter by country"),
    department: Optional[str] = Query(None, description="Filter by department"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsOverviewResponse:
    """Return overview metrics: total spend, average, median, min, max, and headcount."""
    return await AnalyticsService.get_analytics_overview(
        db=db,
        month_str=month,
        country=country,
        department=department,
        currency=currency,
    )


@router.get("/by-country", response_model=CountryAnalyticsResponse, summary="Get analytics grouped by country")
async def get_by_country_analytics(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    department: Optional[str] = Query(None, description="Filter by department"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> CountryAnalyticsResponse:
    """Return country-level salary breakdowns with headcount, total spend, average, and median."""
    return await AnalyticsService.get_by_country_analytics(
        db=db,
        month_str=month,
        department=department,
        currency=currency,
    )


@router.get("/by-department", response_model=DepartmentAnalyticsResponse, summary="Get analytics grouped by department")
async def get_by_department_analytics(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    country: Optional[str] = Query(None, description="Filter by country"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> DepartmentAnalyticsResponse:
    """Return department-level salary breakdowns with headcount, total spend, average, and median."""
    return await AnalyticsService.get_by_department_analytics(
        db=db,
        month_str=month,
        country=country,
        currency=currency,
    )


@router.get("/trends", response_model=AnalyticsTrendsResponse, summary="Get multi-month analytics trends")
async def get_analytics_trends(
    group_by: str = Query("department", pattern="^(department|country|total)$", description="Group category"),
    months: int = Query(12, ge=1, le=36, description="Number of past months to include"),
    currency: str = Query("USD", description="Target reporting currency"),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsTrendsResponse:
    """Return time-series trend data grouped by department or country."""
    return await AnalyticsService.get_analytics_trends(
        db=db,
        group_by=group_by,
        months_count=months,
        currency=currency,
    )
