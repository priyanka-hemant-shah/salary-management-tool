"""
Dashboard API tests.

Uses the isolated in-memory SQLite database and test dataset.
"""

from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


@pytest.fixture
async def sample_dashboard_data(db_session: AsyncSession) -> list[Employee]:
    """Seed sample data with multi-country, multi-department, and multi-month salaries."""
    m_jan = date(2024, 1, 1)
    m_feb = date(2024, 2, 1)

    emp1 = Employee(
        employee_code="EMP-10001",
        first_name="Alice",
        last_name="Smith",
        email="alice@corp.test",
        department="Engineering",
        job_title="Software Engineer",
        country="United States",
        hire_date=date(2022, 1, 10),
    )
    emp2 = Employee(
        employee_code="EMP-10002",
        first_name="Bob",
        last_name="Jones",
        email="bob@corp.test",
        department="Marketing",
        job_title="Marketing Specialist",
        country="United Kingdom",
        hire_date=date(2022, 5, 20),
    )
    emp3 = Employee(
        employee_code="EMP-10003",
        first_name="Carlos",
        last_name="Mendez",
        email="carlos@corp.test",
        department="Engineering",
        job_title="Lead Architect",
        country="Germany",
        hire_date=date(2021, 3, 1),
    )
    employees = [emp1, emp2, emp3]
    db_session.add_all(employees)
    await db_session.flush()

    records = [
        # Jan: Alice ($10,000 USD paid), Bob (£8,000 GBP paid), Carlos (€9,000 EUR unpaid)
        SalaryRecord(
            employee_id=emp1.id,
            salary_month=m_jan,
            base_salary=10000.0,
            currency="USD",
            is_paid=True,
            paid_date=date(2024, 1, 28),
        ),
        SalaryRecord(
            employee_id=emp2.id,
            salary_month=m_jan,
            base_salary=8000.0,
            currency="GBP",
            is_paid=True,
            paid_date=date(2024, 1, 28),
        ),
        SalaryRecord(
            employee_id=emp3.id,
            salary_month=m_jan,
            base_salary=9000.0,
            currency="EUR",
            is_paid=False,
        ),
        # Feb: Alice ($10,000 USD paid), Bob (£8,000 GBP paid), Carlos (€9,000 EUR paid)
        SalaryRecord(
            employee_id=emp1.id,
            salary_month=m_feb,
            base_salary=10000.0,
            currency="USD",
            is_paid=True,
            paid_date=date(2024, 2, 28),
        ),
        SalaryRecord(
            employee_id=emp2.id,
            salary_month=m_feb,
            base_salary=8000.0,
            currency="GBP",
            is_paid=True,
            paid_date=date(2024, 2, 28),
        ),
        SalaryRecord(
            employee_id=emp3.id,
            salary_month=m_feb,
            base_salary=9000.0,
            currency="EUR",
            is_paid=True,
            paid_date=date(2024, 2, 28),
        ),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return employees


class TestDashboardSummary:
    async def test_summary_success(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/summary", params={"month": "2024-01"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 3
        assert data["active_countries"] == 3
        assert data["currency"] == "USD"
        # Alice 10,000 + Bob (8000*1.28 = 10240) + Carlos (9000*1.08 = 9720) = 29960
        assert data["total_salary_spend"] == 29960.0
        assert data["paid_ratio"] == 66.7  # 2 of 3 paid

    async def test_summary_february_all_paid(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/summary", params={"month": "2024-02"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 3
        assert data["paid_ratio"] == 100.0

    async def test_summary_empty_month(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/summary", params={"month": "2020-01"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["headcount"] == 0
        assert data["total_salary_spend"] == 0.0

    async def test_summary_custom_currency(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get(
            "/api/v1/dashboard/summary", params={"month": "2024-01", "currency": "EUR"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["currency"] == "EUR"
        assert data["total_salary_spend"] > 0

    async def test_summary_invalid_month(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/summary", params={"month": "not-a-month"})
        assert resp.status_code == 422


class TestDashboardCharts:
    async def test_salary_by_country(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/salary-by-country", params={"month": "2024-01"})
        assert resp.status_code == 200
        body = resp.json()
        items = body["items"]
        assert len(items) == 3
        countries = [i["country"] for i in items]
        assert "United States" in countries
        assert "United Kingdom" in countries
        assert "Germany" in countries
        # Percentage sum check
        total_pct = sum(i["percentage"] for i in items)
        assert 99.5 <= total_pct <= 100.5

    async def test_salary_trend(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/salary-trend", params={"months": 12})
        assert resp.status_code == 200
        body = resp.json()
        items = body["items"]
        assert len(items) == 2  # Jan and Feb
        assert items[0]["month"] == "2024-01-01"
        assert items[1]["month"] == "2024-02-01"
        assert items[0]["total_spend"] > 0
        assert items[1]["total_spend"] > 0

    async def test_recent_changes(self, client: AsyncClient, sample_dashboard_data):
        resp = await client.get("/api/v1/dashboard/recent-changes", params={"limit": 5})
        assert resp.status_code == 200
        body = resp.json()
        items = body["items"]
        assert len(items) <= 5
        assert len(items) > 0
        first = items[0]
        assert "employee_code" in first
        assert "name" in first
        assert "status" in first

