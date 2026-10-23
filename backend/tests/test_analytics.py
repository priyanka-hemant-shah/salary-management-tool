"""
Analytics API tests.

Uses the isolated in-memory SQLite database and test dataset.
"""

from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


@pytest.fixture
async def sample_analytics_data(db_session: AsyncSession) -> list[Employee]:
    """Seed sample data across departments and countries."""
    m_jan = date(2024, 1, 1)
    m_feb = date(2024, 2, 1)

    emp1 = Employee(
        employee_code="EMP-20001",
        first_name="Diana",
        last_name="Prince",
        email="diana@corp.test",
        department="Engineering",
        job_title="Lead Architect",
        country="United States",
        hire_date=date(2020, 1, 15),
    )
    emp2 = Employee(
        employee_code="EMP-20002",
        first_name="Bruce",
        last_name="Wayne",
        email="bruce@corp.test",
        department="Engineering",
        job_title="Software Engineer",
        country="United States",
        hire_date=date(2021, 6, 1),
    )
    emp3 = Employee(
        employee_code="EMP-20003",
        first_name="Clark",
        last_name="Kent",
        email="clark@corp.test",
        department="Marketing",
        job_title="Content Writer",
        country="United Kingdom",
        hire_date=date(2022, 3, 10),
    )
    employees = [emp1, emp2, emp3]
    db_session.add_all(employees)
    await db_session.flush()

    records = [
        # Jan: Diana ($12,000 USD), Bruce ($8,000 USD), Clark (£5,000 GBP = $6,400 USD)
        SalaryRecord(
            employee_id=emp1.id,
            salary_month=m_jan,
            base_salary=12000.0,
            currency="USD",
            is_paid=True,
        ),
        SalaryRecord(
            employee_id=emp2.id,
            salary_month=m_jan,
            base_salary=8000.0,
            currency="USD",
            is_paid=True,
        ),
        SalaryRecord(
            employee_id=emp3.id,
            salary_month=m_jan,
            base_salary=5000.0,
            currency="GBP",
            is_paid=True,
        ),
        # Feb: Same
        SalaryRecord(
            employee_id=emp1.id,
            salary_month=m_feb,
            base_salary=12000.0,
            currency="USD",
            is_paid=True,
        ),
        SalaryRecord(
            employee_id=emp2.id,
            salary_month=m_feb,
            base_salary=8000.0,
            currency="USD",
            is_paid=True,
        ),
        SalaryRecord(
            employee_id=emp3.id,
            salary_month=m_feb,
            base_salary=5000.0,
            currency="GBP",
            is_paid=True,
        ),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return employees


class TestAnalyticsOverview:
    async def test_overview_all(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get("/api/v1/analytics/overview", params={"month": "2024-01"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 3
        # Diana 12000, Bruce 8000, Clark 5000*1.28 = 6400 -> total = 26400
        assert data["total_spend"] == 26400.0
        assert data["avg_salary"] == 8800.0
        assert data["median_salary"] == 8000.0
        assert data["highest_salary"] == 12000.0
        assert data["lowest_salary"] == 6400.0

    async def test_overview_filter_department(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get(
            "/api/v1/analytics/overview",
            params={"month": "2024-01", "department": "Engineering"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 2
        assert data["total_spend"] == 20000.0
        assert data["avg_salary"] == 10000.0
        assert data["median_salary"] == 10000.0

    async def test_overview_filter_country(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get(
            "/api/v1/analytics/overview",
            params={"month": "2024-01", "country": "United Kingdom"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 1
        assert data["total_spend"] == 6400.0

    async def test_overview_empty(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get(
            "/api/v1/analytics/overview",
            params={"month": "2019-01"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 0
        assert data["total_spend"] == 0.0


class TestAnalyticsBreakdowns:
    async def test_by_country(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get("/api/v1/analytics/by-country", params={"month": "2024-01"})
        assert resp.status_code == 200
        data = resp.json()
        items = data["items"]
        assert len(items) == 2
        us_item = next(i for i in items if i["country"] == "United States")
        assert us_item["headcount"] == 2
        assert us_item["total_spend"] == 20000.0
        assert us_item["median_salary"] == 10000.0
        uk_item = next(i for i in items if i["country"] == "United Kingdom")
        assert uk_item["headcount"] == 1
        assert uk_item["total_spend"] == 6400.0

    async def test_by_department(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get("/api/v1/analytics/by-department", params={"month": "2024-01"})
        assert resp.status_code == 200
        data = resp.json()
        items = data["items"]
        assert len(items) == 2
        eng_item = next(i for i in items if i["department"] == "Engineering")
        assert eng_item["headcount"] == 2
        assert eng_item["total_spend"] == 20000.0
        mkt_item = next(i for i in items if i["department"] == "Marketing")
        assert mkt_item["headcount"] == 1
        assert mkt_item["total_spend"] == 6400.0

    async def test_trends_by_department(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get(
            "/api/v1/analytics/trends",
            params={"group_by": "department", "months": 6},
        )
        assert resp.status_code == 200
        data = resp.json()
        items = data["items"]
        assert len(items) == 4  # 2 depts x 2 months (Jan & Feb)
        depts = {i["category"] for i in items}
        assert "Engineering" in depts
        assert "Marketing" in depts

    async def test_trends_by_country(self, client: AsyncClient, sample_analytics_data):
        resp = await client.get(
            "/api/v1/analytics/trends",
            params={"group_by": "country", "months": 6},
        )
        assert resp.status_code == 200
        data = resp.json()
        items = data["items"]
        assert len(items) == 4  # 2 countries x 2 months
        countries = {i["category"] for i in items}
        assert "United States" in countries
        assert "United Kingdom" in countries

