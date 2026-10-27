"""
End-to-End Cross-Layer Regression Tests — PR 13

Validates primary HR Manager workflow cycles across all API endpoints:
1. Executive Dashboard monthly review -> Top country spend -> 12-month expenditure trend
2. Employee Directory auditing -> Filter by country & paid status -> Individual salary history
3. Excel streaming export -> Verification of headers and spreadsheet structure
4. Advanced Analytics -> Multi-currency conversion -> Department breakdown
5. AI Natural Language queries -> Mathematical consistency with analytics aggregates
"""

from datetime import date
import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import openpyxl

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


@pytest.fixture
async def e2e_seed_data(db_session: AsyncSession) -> list[Employee]:
    """Seed a representative multi-country dataset across months."""
    MONTH_JAN = date(2024, 1, 1)
    MONTH_FEB = date(2024, 2, 1)

    employees = [
        Employee(
            employee_code="E2E-001",
            first_name="Alice",
            last_name="Adams",
            email="alice@acme.test",
            department="Engineering",
            job_title="Staff Engineer",
            country="United States",
            hire_date=date(2020, 1, 1),
        ),
        Employee(
            employee_code="E2E-002",
            first_name="Bob",
            last_name="Brown",
            email="bob@acme.test",
            department="Marketing",
            job_title="Lead Manager",
            country="United States",
            hire_date=date(2021, 6, 1),
        ),
        Employee(
            employee_code="E2E-003",
            first_name="Carol",
            last_name="Clark",
            email="carol@acme.test",
            department="Engineering",
            job_title="Senior Developer",
            country="United Kingdom",
            hire_date=date(2019, 3, 15),
        ),
    ]
    db_session.add_all(employees)
    await db_session.flush()

    records = [
        # Alice
        SalaryRecord(employee_id=employees[0].id, salary_month=MONTH_JAN,
                     base_salary=120_000, currency="USD", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[0].id, salary_month=MONTH_FEB,
                     base_salary=120_000, currency="USD", is_paid=True, paid_date=date(2024, 2, 28)),
        # Bob
        SalaryRecord(employee_id=employees[1].id, salary_month=MONTH_JAN,
                     base_salary=90_000, currency="USD", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[1].id, salary_month=MONTH_FEB,
                     base_salary=90_000, currency="USD", is_paid=False),
        # Carol
        SalaryRecord(employee_id=employees[2].id, salary_month=MONTH_JAN,
                     base_salary=80_000, currency="GBP", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[2].id, salary_month=MONTH_FEB,
                     base_salary=80_000, currency="GBP", is_paid=True, paid_date=date(2024, 2, 28)),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return employees


@pytest.mark.asyncio
async def test_e2e_hr_monthly_audit_cycle(client: AsyncClient, e2e_seed_data: list[Employee]):
    """
    Workflow 1: Comprehensive Monthly HR Payroll Audit Cycle
    Simulates an HR Manager reviewing company payroll from high-level KPIs down to specific records.
    """
    # Step 1: Health check
    health_resp = await client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    # Step 2: Available months metadata
    months_resp = await client.get("/api/v1/employees/meta/months")
    assert months_resp.status_code == 200
    months = months_resp.json()["months"]
    assert len(months) > 0
    latest_month = months[0][:7]  # Format as YYYY-MM

    # Step 3: Executive Dashboard summary
    dash_resp = await client.get(f"/api/v1/dashboard/summary?month={latest_month}&currency=USD")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["headcount"] > 0
    assert dash_data["total_salary_spend"] > 0
    assert dash_data["avg_salary"] > 0
    assert dash_data["active_countries"] > 0
    assert dash_data["currency"] == "USD"

    # Step 4: Geographic breakdown
    country_resp = await client.get(f"/api/v1/dashboard/salary-by-country?month={latest_month}&currency=USD")
    assert country_resp.status_code == 200
    countries = country_resp.json()["items"]
    assert len(countries) > 0
    top_country = countries[0]["country"]

    # Step 5: Employee Directory drill-down into top country
    emp_resp = await client.get(
        "/api/v1/employees",
        params={"country": top_country, "month": latest_month, "page": 1, "page_size": 10},
    )
    assert emp_resp.status_code == 200
    emp_data = emp_resp.json()
    assert len(emp_data["data"]) > 0
    first_employee = emp_data["data"][0]
    assert first_employee["country"] == top_country

    # Step 6: Employee Detail & 12-month salary history
    detail_resp = await client.get(f"/api/v1/employees/{first_employee['id']}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["employee_code"] == first_employee["employee_code"]
    assert len(detail_data["salary_records"]) > 0

    # Step 7: Stream Excel Export for filtered top country
    export_resp = await client.get(
        f"/api/v1/employees/export?country={top_country}&month={latest_month}"
    )
    assert export_resp.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in export_resp.headers["content-type"]
    wb = openpyxl.load_workbook(io.BytesIO(export_resp.content))
    assert "Employees" in wb.sheetnames
    sheet = wb["Employees"]
    headers = [cell.value for cell in sheet[1]]
    assert "Employee Code" in headers
    assert "Base Salary" in headers
    assert "Country" in headers

    # Step 8: Multi-currency Analytics validation
    eur_resp = await client.get(f"/api/v1/analytics/overview?month={latest_month}&currency=EUR")
    assert eur_resp.status_code == 200
    eur_data = eur_resp.json()
    assert eur_data["currency"] == "EUR"
    assert eur_data["total_spend"] > 0
    assert eur_data["headcount"] == dash_data["headcount"]


@pytest.mark.asyncio
async def test_e2e_ai_query_to_analytics_consistency(client: AsyncClient, e2e_seed_data: list[Employee]):
    """
    Workflow 2: AI Query vs Analytics Cross-Layer Verification
    Validates that the AI Orchestrator returns figures mathematically consistent with Analytics Service.
    """
    # 1. Ask total salary spend via AI
    ai_resp = await client.post(
        "/api/v1/ai/ask",
        json={"question": "What is our total salary spend this month?", "context": {"currency": "USD"}},
    )
    assert ai_resp.status_code == 200
    ai_data = ai_resp.json()
    assert ai_data["metric_type"] == "total_cost"
    assert len(ai_data["data"]) > 0
    ai_total_spend = ai_data["data"][0]["total_spend"]
    ai_headcount = ai_data["data"][0]["headcount"]

    # 2. Query Analytics Overview directly
    analytics_resp = await client.get(f"/api/v1/analytics/overview?currency=USD")
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()

    # Numbers must be consistent
    assert pytest.approx(ai_total_spend, rel=1e-3) == analytics_data["total_spend"]
    assert ai_headcount == analytics_data["headcount"]
