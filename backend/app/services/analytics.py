"""
Analytics & Dashboard Service.

Provides centralized salary aggregation, currency normalization,
and statistical computations across countries and departments.
This service is shared between Dashboard, Analytics, and AI endpoints.
"""

from collections import defaultdict
from datetime import date
import statistics
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AnalyticsTrendItem,
    AnalyticsTrendsResponse,
    CountryAnalyticsItem,
    CountryAnalyticsResponse,
    DepartmentAnalyticsItem,
    DepartmentAnalyticsResponse,
)
from app.schemas.dashboard import (
    CountrySpendItem,
    DashboardSummaryResponse,
    RecentChangeItem,
    RecentChangesResponse,
    SalaryByCountryResponse,
    SalaryTrendItem,
    SalaryTrendResponse,
)

# Reference exchange rates relative to 1 USD
EXCHANGE_RATES_TO_USD: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.28,
    "CAD": 0.73,
    "AUD": 0.65,
    "JPY": 0.0066,
    "INR": 0.012,
    "SGD": 0.74,
    "BRL": 0.18,
}


def convert_currency(amount: float, from_currency: str, to_currency: str = "USD") -> float:
    """Convert an amount from native currency to target reporting currency."""
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()
    if from_curr == to_curr:
        return round(amount, 2)
    from_rate = EXCHANGE_RATES_TO_USD.get(from_curr, 1.0)
    to_rate = EXCHANGE_RATES_TO_USD.get(to_curr, 1.0)
    usd_val = amount * from_rate
    return round(usd_val / to_rate, 2)


def parse_month(month_str: Optional[str]) -> Optional[date]:
    """Parse 'YYYY-MM' string to the first day of that month."""
    if not month_str:
        return None
    try:
        parts = month_str.split("-")
        return date(int(parts[0]), int(parts[1]), 1)
    except (ValueError, IndexError, AttributeError):
        raise HTTPException(status_code=422, detail="month must be in YYYY-MM format")


async def get_latest_salary_month(db: AsyncSession) -> date:
    """Return the most recent salary_month recorded in the database."""
    res = await db.execute(select(func.max(SalaryRecord.salary_month)))
    latest = res.scalar_one_or_none()
    return latest if latest else date.today().replace(day=1)


class AnalyticsService:
    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession, month_str: Optional[str] = None, currency: str = "USD"
    ) -> DashboardSummaryResponse:
        salary_date = parse_month(month_str) if month_str else await get_latest_salary_month(db)

        stmt = (
            select(
                Employee.id,
                Employee.country,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
                SalaryRecord.is_paid,
            )
            .join(SalaryRecord, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month == salary_date)
        )
        rows = (await db.execute(stmt)).all()

        if not rows:
            return DashboardSummaryResponse(
                headcount=0,
                total_salary_spend=0.0,
                avg_salary=0.0,
                active_countries=0,
                paid_ratio=0.0,
                salary_month=salary_date,
                currency=currency,
            )

        countries = set()
        total_spend = 0.0
        paid_count = 0

        for row in rows:
            _, country, salary, curr, is_paid = row
            countries.add(country)
            converted = convert_currency(salary, curr, currency)
            total_spend += converted
            if is_paid:
                paid_count += 1

        headcount = len(rows)
        avg_sal = round(total_spend / headcount, 2) if headcount > 0 else 0.0
        paid_ratio = round((paid_count / headcount) * 100, 1) if headcount > 0 else 0.0

        return DashboardSummaryResponse(
            headcount=headcount,
            total_salary_spend=round(total_spend, 2),
            avg_salary=avg_sal,
            active_countries=len(countries),
            paid_ratio=paid_ratio,
            salary_month=salary_date,
            currency=currency,
        )

    @staticmethod
    async def get_salary_by_country(
        db: AsyncSession, month_str: Optional[str] = None, currency: str = "USD"
    ) -> SalaryByCountryResponse:
        salary_date = parse_month(month_str) if month_str else await get_latest_salary_month(db)

        stmt = (
            select(
                Employee.country,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .join(SalaryRecord, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month == salary_date)
        )
        rows = (await db.execute(stmt)).all()

        country_spend = defaultdict(float)
        country_counts = defaultdict(int)
        total_all = 0.0

        for country, salary, curr in rows:
            converted = convert_currency(salary, curr, currency)
            country_spend[country] += converted
            country_counts[country] += 1
            total_all += converted

        items: List[CountrySpendItem] = []
        for c, spend in country_spend.items():
            pct = round((spend / total_all) * 100, 2) if total_all > 0 else 0.0
            items.append(
                CountrySpendItem(
                    country=c,
                    total_spend=round(spend, 2),
                    employee_count=country_counts[c],
                    percentage=pct,
                )
            )

        items.sort(key=lambda x: x.total_spend, reverse=True)
        return SalaryByCountryResponse(
            items=items,
            salary_month=salary_date,
            currency=currency,
        )

    @staticmethod
    async def get_salary_trend(
        db: AsyncSession, months_count: int = 12, currency: str = "USD"
    ) -> SalaryTrendResponse:
        # Get distinct recent months up to months_count
        month_stmt = (
            select(SalaryRecord.salary_month)
            .distinct()
            .order_by(SalaryRecord.salary_month.desc())
            .limit(months_count)
        )
        recent_months = [r[0] for r in (await db.execute(month_stmt)).all()]
        recent_months.sort()  # Chronological order

        if not recent_months:
            return SalaryTrendResponse(items=[], currency=currency)

        # Query all records across these months
        stmt = (
            select(
                SalaryRecord.salary_month,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .where(SalaryRecord.salary_month.in_(recent_months))
        )
        rows = (await db.execute(stmt)).all()

        monthly_totals = defaultdict(float)
        monthly_counts = defaultdict(int)

        for m, salary, curr in rows:
            converted = convert_currency(salary, curr, currency)
            monthly_totals[m] += converted
            monthly_counts[m] += 1

        items: List[SalaryTrendItem] = []
        for m in recent_months:
            spend = monthly_totals[m]
            cnt = monthly_counts[m]
            avg = round(spend / cnt, 2) if cnt > 0 else 0.0
            items.append(
                SalaryTrendItem(
                    month=m,
                    month_label=m.strftime("%b %Y"),
                    total_spend=round(spend, 2),
                    employee_count=cnt,
                    avg_salary=avg,
                )
            )

        return SalaryTrendResponse(items=items, currency=currency)

    @staticmethod
    async def get_recent_changes(
        db: AsyncSession, limit: int = 10
    ) -> RecentChangesResponse:
        """Fetch recent employee activities (latest hires / records)."""
        stmt = (
            select(
                Employee.id,
                Employee.employee_code,
                Employee.first_name,
                Employee.last_name,
                Employee.department,
                Employee.country,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
                SalaryRecord.salary_month,
                SalaryRecord.is_paid,
            )
            .join(SalaryRecord, SalaryRecord.employee_id == Employee.id)
            .order_by(SalaryRecord.salary_month.desc(), Employee.hire_date.desc(), Employee.id.desc())
            .limit(limit)
        )
        rows = (await db.execute(stmt)).all()

        items: List[RecentChangeItem] = []
        for row in rows:
            (
                emp_id,
                code,
                first,
                last,
                dept,
                country,
                salary,
                curr,
                s_month,
                is_paid,
            ) = row
            items.append(
                RecentChangeItem(
                    id=emp_id,
                    employee_code=code,
                    name=f"{first} {last}",
                    department=dept,
                    country=country,
                    salary=salary,
                    currency=curr,
                    effective_date=s_month,
                    status="Paid" if is_paid else "Pending",
                )
            )

        return RecentChangesResponse(items=items)

    @staticmethod
    async def get_analytics_overview(
        db: AsyncSession,
        month_str: Optional[str] = None,
        country: Optional[str] = None,
        department: Optional[str] = None,
        currency: str = "USD",
    ) -> AnalyticsOverviewResponse:
        salary_date = parse_month(month_str) if month_str else await get_latest_salary_month(db)

        stmt = (
            select(
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .join(Employee, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month == salary_date)
        )
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)

        rows = (await db.execute(stmt)).all()

        if not rows:
            return AnalyticsOverviewResponse(
                total_spend=0.0,
                avg_salary=0.0,
                median_salary=0.0,
                headcount=0,
                highest_salary=0.0,
                lowest_salary=0.0,
                currency=currency,
                salary_month=salary_date,
            )

        converted_salaries = [
            convert_currency(sal, curr, currency) for sal, curr in rows
        ]
        total_spend = sum(converted_salaries)
        count = len(converted_salaries)
        avg_sal = total_spend / count
        median_sal = statistics.median(converted_salaries)
        max_sal = max(converted_salaries)
        min_sal = min(converted_salaries)

        return AnalyticsOverviewResponse(
            total_spend=round(total_spend, 2),
            avg_salary=round(avg_sal, 2),
            median_salary=round(median_sal, 2),
            headcount=count,
            highest_salary=round(max_sal, 2),
            lowest_salary=round(min_sal, 2),
            currency=currency,
            salary_month=salary_date,
        )

    @staticmethod
    async def get_by_country_analytics(
        db: AsyncSession,
        month_str: Optional[str] = None,
        department: Optional[str] = None,
        currency: str = "USD",
    ) -> CountryAnalyticsResponse:
        salary_date = parse_month(month_str) if month_str else await get_latest_salary_month(db)

        stmt = (
            select(
                Employee.country,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .join(Employee, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month == salary_date)
        )
        if department:
            stmt = stmt.where(Employee.department == department)

        rows = (await db.execute(stmt)).all()

        country_data = defaultdict(list)
        total_spend_all = 0.0

        for country, sal, curr in rows:
            converted = convert_currency(sal, curr, currency)
            country_data[country].append(converted)
            total_spend_all += converted

        items: List[CountryAnalyticsItem] = []
        for country, salaries in country_data.items():
            cnt = len(salaries)
            c_spend = sum(salaries)
            c_avg = c_spend / cnt
            c_median = statistics.median(salaries)
            pct = round((c_spend / total_spend_all) * 100, 2) if total_spend_all > 0 else 0.0

            items.append(
                CountryAnalyticsItem(
                    country=country,
                    headcount=cnt,
                    total_spend=round(c_spend, 2),
                    avg_salary=round(c_avg, 2),
                    median_salary=round(c_median, 2),
                    percentage_of_total=pct,
                )
            )

        items.sort(key=lambda x: x.total_spend, reverse=True)
        return CountryAnalyticsResponse(
            items=items,
            salary_month=salary_date,
            currency=currency,
        )

    @staticmethod
    async def get_by_department_analytics(
        db: AsyncSession,
        month_str: Optional[str] = None,
        country: Optional[str] = None,
        currency: str = "USD",
    ) -> DepartmentAnalyticsResponse:
        salary_date = parse_month(month_str) if month_str else await get_latest_salary_month(db)

        stmt = (
            select(
                Employee.department,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .join(Employee, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month == salary_date)
        )
        if country:
            stmt = stmt.where(Employee.country == country)

        rows = (await db.execute(stmt)).all()

        dept_data = defaultdict(list)
        total_spend_all = 0.0

        for dept, sal, curr in rows:
            converted = convert_currency(sal, curr, currency)
            dept_data[dept].append(converted)
            total_spend_all += converted

        items: List[DepartmentAnalyticsItem] = []
        for dept, salaries in dept_data.items():
            cnt = len(salaries)
            d_spend = sum(salaries)
            d_avg = d_spend / cnt
            d_median = statistics.median(salaries)
            pct = round((d_spend / total_spend_all) * 100, 2) if total_spend_all > 0 else 0.0

            items.append(
                DepartmentAnalyticsItem(
                    department=dept,
                    headcount=cnt,
                    total_spend=round(d_spend, 2),
                    avg_salary=round(d_avg, 2),
                    median_salary=round(d_median, 2),
                    percentage_of_total=pct,
                )
            )

        items.sort(key=lambda x: x.total_spend, reverse=True)
        return DepartmentAnalyticsResponse(
            items=items,
            salary_month=salary_date,
            currency=currency,
        )

    @staticmethod
    async def get_analytics_trends(
        db: AsyncSession,
        group_by: str = "department",
        months_count: int = 12,
        currency: str = "USD",
    ) -> AnalyticsTrendsResponse:
        month_stmt = (
            select(SalaryRecord.salary_month)
            .distinct()
            .order_by(SalaryRecord.salary_month.desc())
            .limit(months_count)
        )
        recent_months = [r[0] for r in (await db.execute(month_stmt)).all()]
        recent_months.sort()

        if not recent_months:
            return AnalyticsTrendsResponse(items=[], group_by=group_by, currency=currency)

        col = Employee.department if group_by == "department" else Employee.country
        stmt = (
            select(
                SalaryRecord.salary_month,
                col,
                SalaryRecord.base_salary,
                SalaryRecord.currency,
            )
            .join(Employee, SalaryRecord.employee_id == Employee.id)
            .where(SalaryRecord.salary_month.in_(recent_months))
        )
        rows = (await db.execute(stmt)).all()

        grouped_data = defaultdict(list)
        for m, cat, sal, curr in rows:
            converted = convert_currency(sal, curr, currency)
            grouped_data[(m, cat)].append(converted)

        items: List[AnalyticsTrendItem] = []
        # Sort by month, then category
        for (m, cat), salaries in sorted(grouped_data.items(), key=lambda x: (x[0][0], x[0][1])):
            cnt = len(salaries)
            tot = sum(salaries)
            avg = tot / cnt if cnt > 0 else 0.0
            items.append(
                AnalyticsTrendItem(
                    month=m,
                    month_label=m.strftime("%b %Y"),
                    category=cat,
                    total_spend=round(tot, 2),
                    avg_salary=round(avg, 2),
                    headcount=cnt,
                )
            )

        return AnalyticsTrendsResponse(
            items=items,
            group_by=group_by,
            currency=currency,
        )

