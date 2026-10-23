"""
PR 3 — Employees API tests.

All tests use the in-memory SQLite DB defined in conftest.py.
Fixtures create a small controlled dataset (not the 10k seed) so assertions
are deterministic.
"""

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


# ---------------------------------------------------------------------------
# Test-data fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def sample_employees(db_session: AsyncSession) -> list[Employee]:
    """
    Insert 3 employees across 2 countries with salary records for 2 months.

    Layout
    ------
    emp1 (US, Engineering) - Jan paid, Feb unpaid
    emp2 (US, Marketing)   - Jan paid, Feb paid
    emp3 (UK, Engineering) - Jan paid, Feb unpaid
    """
    MONTH_JAN = date(2024, 1, 1)
    MONTH_FEB = date(2024, 2, 1)

    employees = [
        Employee(
            employee_code="T-00001",
            first_name="Alice",
            last_name="Adams",
            email="alice@test.example.com",
            department="Engineering",
            job_title="Engineer",
            country="United States",
            hire_date=date(2020, 1, 1),
        ),
        Employee(
            employee_code="T-00002",
            first_name="Bob",
            last_name="Brown",
            email="bob@test.example.com",
            department="Marketing",
            job_title="Manager",
            country="United States",
            hire_date=date(2021, 6, 1),
        ),
        Employee(
            employee_code="T-00003",
            first_name="Carol",
            last_name="Clark",
            email="carol@test.example.com",
            department="Engineering",
            job_title="Lead",
            country="United Kingdom",
            hire_date=date(2019, 3, 15),
        ),
    ]
    db_session.add_all(employees)
    await db_session.flush()

    records = [
        # Alice — Jan paid, Feb unpaid
        SalaryRecord(employee_id=employees[0].id, salary_month=MONTH_JAN,
                     base_salary=95_000, currency="USD", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[0].id, salary_month=MONTH_FEB,
                     base_salary=95_000, currency="USD", is_paid=False),
        # Bob — Jan paid, Feb paid
        SalaryRecord(employee_id=employees[1].id, salary_month=MONTH_JAN,
                     base_salary=80_000, currency="USD", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[1].id, salary_month=MONTH_FEB,
                     base_salary=80_000, currency="USD", is_paid=True, paid_date=date(2024, 2, 28)),
        # Carol — Jan paid, Feb unpaid
        SalaryRecord(employee_id=employees[2].id, salary_month=MONTH_JAN,
                     base_salary=70_000, currency="GBP", is_paid=True, paid_date=date(2024, 1, 31)),
        SalaryRecord(employee_id=employees[2].id, salary_month=MONTH_FEB,
                     base_salary=70_000, currency="GBP", is_paid=False),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return employees


# ---------------------------------------------------------------------------
# List endpoint — basic
# ---------------------------------------------------------------------------

class TestEmployeeList:
    async def test_list_returns_200(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees")
        assert resp.status_code == 200

    async def test_list_response_structure(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "2024-01"})
        body = resp.json()
        assert "data" in body
        assert "meta" in body
        assert "salary_month" in body

    async def test_list_returns_all_employees(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "2024-01"})
        body = resp.json()
        assert body["meta"]["total"] == 3
        assert len(body["data"]) == 3

    async def test_list_items_have_salary_info(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "2024-01"})
        items = resp.json()["data"]
        for item in items:
            assert item["salary"] is not None
            assert "base_salary" in item["salary"]
            assert "is_paid" in item["salary"]

    async def test_list_includes_full_name(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "2024-01"})
        items = resp.json()["data"]
        full_names = {i["full_name"] for i in items}
        assert "Alice Adams" in full_names

    async def test_list_salary_month_in_response(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "2024-02"})
        assert resp.json()["salary_month"] == "2024-02-01"


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------

class TestEmployeeFilters:
    async def test_filter_by_country_us(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "country": "United States"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 2
        for item in body["data"]:
            assert item["country"] == "United States"

    async def test_filter_by_country_uk(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "country": "United Kingdom"},
        )
        assert resp.json()["meta"]["total"] == 1

    async def test_filter_is_paid_true(self, client: AsyncClient, sample_employees):
        """In February, only Bob is paid."""
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-02", "is_paid": "true"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 1
        assert body["data"][0]["salary"]["is_paid"] is True

    async def test_filter_is_paid_false(self, client: AsyncClient, sample_employees):
        """In February, Alice and Carol are unpaid."""
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-02", "is_paid": "false"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 2
        for item in body["data"]:
            assert item["salary"]["is_paid"] is False

    async def test_filter_in_january_all_paid(self, client: AsyncClient, sample_employees):
        """All 3 employees are paid in January."""
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "is_paid": "true"},
        )
        assert resp.json()["meta"]["total"] == 3

    async def test_search_by_first_name(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "search": "Alice"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 1
        assert body["data"][0]["first_name"] == "Alice"

    async def test_search_by_email(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "search": "carol@test"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 1
        assert body["data"][0]["email"] == "carol@test.example.com"

    async def test_search_by_employee_code(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "search": "T-00002"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 1
        assert body["data"][0]["employee_code"] == "T-00002"

    async def test_search_no_results(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "search": "zzz_not_a_name"},
        )
        assert resp.json()["meta"]["total"] == 0

    async def test_combined_filters(self, client: AsyncClient, sample_employees):
        """country=US + is_paid=false in Feb → only Alice."""
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-02", "country": "United States", "is_paid": "false"},
        )
        body = resp.json()
        assert body["meta"]["total"] == 1
        assert body["data"][0]["first_name"] == "Alice"

    async def test_invalid_month_format(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees", params={"month": "Jan-2024"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class TestEmployeePagination:
    async def test_page_size_limits(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "page_size": 2},
        )
        body = resp.json()
        assert len(body["data"]) == 2
        assert body["meta"]["pages"] == 2
        assert body["meta"]["total"] == 3

    async def test_second_page(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "page": 2, "page_size": 2},
        )
        body = resp.json()
        assert len(body["data"]) == 1  # 3 total, 2 per page → 1 on page 2

    async def test_meta_fields(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees",
            params={"month": "2024-01", "page": 1, "page_size": 10},
        )
        meta = resp.json()["meta"]
        assert meta["page"] == 1
        assert meta["page_size"] == 10
        assert meta["total"] == 3
        assert meta["pages"] == 1


# ---------------------------------------------------------------------------
# Employee detail
# ---------------------------------------------------------------------------

class TestEmployeeDetail:
    async def test_get_existing_employee(self, client: AsyncClient, sample_employees):
        emp_id = sample_employees[0].id
        resp = await client.get(f"/api/v1/employees/{emp_id}")
        assert resp.status_code == 200

    async def test_detail_has_salary_records(self, client: AsyncClient, sample_employees):
        emp_id = sample_employees[0].id
        resp = await client.get(f"/api/v1/employees/{emp_id}")
        body = resp.json()
        assert len(body["salary_records"]) == 2  # Alice has Jan + Feb

    async def test_detail_salary_records_ordered_newest_first(
        self, client: AsyncClient, sample_employees
    ):
        emp_id = sample_employees[0].id
        resp = await client.get(f"/api/v1/employees/{emp_id}")
        months = [r["salary_month"] for r in resp.json()["salary_records"]]
        assert months == sorted(months, reverse=True)

    async def test_detail_returns_full_name(self, client: AsyncClient, sample_employees):
        emp_id = sample_employees[0].id
        resp = await client.get(f"/api/v1/employees/{emp_id}")
        assert resp.json()["full_name"] == "Alice Adams"

    async def test_get_nonexistent_employee_returns_404(
        self, client: AsyncClient, sample_employees
    ):
        resp = await client.get("/api/v1/employees/999999")
        assert resp.status_code == 404

    async def test_detail_month_label(self, client: AsyncClient, sample_employees):
        emp_id = sample_employees[0].id
        resp = await client.get(f"/api/v1/employees/{emp_id}")
        records = resp.json()["salary_records"]
        # newest record should be Feb 2024
        assert records[0]["month_label"] == "Feb 2024"


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

class TestEmployeeExport:
    async def test_export_returns_200(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees/export", params={"month": "2024-01"}
        )
        assert resp.status_code == 200

    async def test_export_content_type(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees/export", params={"month": "2024-01"}
        )
        assert "spreadsheetml" in resp.headers["content-type"]

    async def test_export_content_disposition(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees/export", params={"month": "2024-01"}
        )
        assert "attachment" in resp.headers["content-disposition"]
        assert ".xlsx" in resp.headers["content-disposition"]

    async def test_export_non_empty(self, client: AsyncClient, sample_employees):
        resp = await client.get(
            "/api/v1/employees/export", params={"month": "2024-01"}
        )
        assert len(resp.content) > 0

    async def test_export_respects_filters(self, client: AsyncClient, sample_employees):
        """Export with country filter should produce a smaller file than unfiltered."""
        full = await client.get("/api/v1/employees/export", params={"month": "2024-01"})
        filtered = await client.get(
            "/api/v1/employees/export",
            params={"month": "2024-01", "country": "United Kingdom"},
        )
        # Both succeed; filtered file should be smaller (fewer rows)
        assert filtered.status_code == 200
        assert len(filtered.content) < len(full.content)


# ---------------------------------------------------------------------------
# Meta endpoints
# ---------------------------------------------------------------------------

class TestMetaEndpoints:
    async def test_countries_endpoint(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees/meta/countries")
        assert resp.status_code == 200
        countries = resp.json()["countries"]
        assert "United States" in countries
        assert "United Kingdom" in countries

    async def test_months_endpoint(self, client: AsyncClient, sample_employees):
        resp = await client.get("/api/v1/employees/meta/months")
        assert resp.status_code == 200
        months = resp.json()["months"]
        assert "2024-01-01" in months
        assert "2024-02-01" in months

