"""
AI Query Foundation tests.

Tests natural language salary question answering, entity extraction,
allowlist query classification, demo mode fallback, and chart specifications.
"""

from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.matcher import classify_question, extract_entities
from app.ai.query_spec import QueryType
from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


@pytest.fixture
async def sample_ai_data(db_session: AsyncSession) -> list[Employee]:
    """Seed test dataset for AI query verification."""
    m_jan = date(2024, 1, 1)
    m_feb = date(2024, 2, 1)

    emp1 = Employee(
        employee_code="EMP-30001",
        first_name="Arthur",
        last_name="Curry",
        email="arthur@corp.test",
        department="Engineering",
        job_title="Software Architect",
        country="United States",
        hire_date=date(2021, 2, 1),
    )
    emp2 = Employee(
        employee_code="EMP-30002",
        first_name="Barry",
        last_name="Allen",
        email="barry@corp.test",
        department="Marketing",
        job_title="Speed Marketer",
        country="United Kingdom",
        hire_date=date(2022, 4, 15),
    )
    emp3 = Employee(
        employee_code="EMP-30003",
        first_name="Victor",
        last_name="Stone",
        email="victor@corp.test",
        department="Engineering",
        job_title="Systems Engineer",
        country="Germany",
        hire_date=date(2020, 11, 20),
    )
    employees = [emp1, emp2, emp3]
    db_session.add_all(employees)
    await db_session.flush()

    records = [
        # Jan
        SalaryRecord(employee_id=emp1.id, salary_month=m_jan, base_salary=11000.0, currency="USD", is_paid=True),
        SalaryRecord(employee_id=emp2.id, salary_month=m_jan, base_salary=7000.0, currency="GBP", is_paid=True),
        SalaryRecord(employee_id=emp3.id, salary_month=m_jan, base_salary=8500.0, currency="EUR", is_paid=True),
        # Feb
        SalaryRecord(employee_id=emp1.id, salary_month=m_feb, base_salary=11000.0, currency="USD", is_paid=True),
        SalaryRecord(employee_id=emp2.id, salary_month=m_feb, base_salary=7000.0, currency="GBP", is_paid=True),
        SalaryRecord(employee_id=emp3.id, salary_month=m_feb, base_salary=8500.0, currency="EUR", is_paid=True),
    ]
    db_session.add_all(records)
    await db_session.flush()
    return employees


class TestAIMatcher:
    def test_extract_entities(self):
        countries, depts, curr, months = extract_entities("What is the average engineering salary in Germany in USD over 6 months?")
        assert "Germany" in countries
        assert "Engineering" in depts
        assert curr == "USD"
        assert months == 6

    def test_classify_total_cost(self):
        spec = classify_question("What is our total spend this month?")
        assert spec.query_type == QueryType.TOTAL_COST

    def test_classify_median(self):
        spec = classify_question("What is the median salary in the US?")
        assert spec.query_type == QueryType.MEDIAN_SALARY
        assert spec.country == "United States"

    def test_classify_trend(self):
        spec = classify_question("Show me the salary trend for the last 6 months")
        assert spec.query_type == QueryType.SALARY_TREND
        assert spec.months_count == 6

    def test_classify_department_comparison(self):
        spec = classify_question("Compare Engineering vs Marketing salary costs")
        assert spec.query_type == QueryType.DEPARTMENT_COMPARISON
        assert "Engineering" in spec.departments
        assert "Marketing" in spec.departments


class TestAIEndpoints:
    async def test_suggested_questions(self, client: AsyncClient):
        resp = await client.get("/api/v1/ai/suggested-questions")
        assert resp.status_code == 200
        questions = resp.json()["questions"]
        assert len(questions) >= 5
        assert any("total salary spend" in q for q in questions)

    async def test_ask_total_cost(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "What is our total salary spend this month?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "total_cost"
        assert body["chart_type"] == "metric"
        assert "total salary spend" in body["answer_text"].lower()
        assert body["is_demo_mode"] is True
        assert len(body["data"]) > 0
        assert body["data"][0]["total_spend"] > 0

    async def test_ask_average_salary_by_country(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "What is the average salary in Germany?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "avg_salary"
        assert "average" in body["answer_text"].lower()
        assert "germany" in body["answer_text"].lower()

    async def test_ask_median_salary(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "What is the median salary in the United States?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "median_salary"
        assert "median" in body["answer_text"].lower()

    async def test_ask_headcount(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "How many employees are in Engineering?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "headcount"
        assert "active employees" in body["answer_text"]

    async def test_ask_top_countries(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "Which country has the highest average salary?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "top_countries"
        assert body["chart_type"] == "bar"
        assert len(body["data"]) > 0

    async def test_ask_department_comparison(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "Compare Engineering vs Marketing salary costs"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "department_comparison"
        assert body["chart_type"] == "bar"

    async def test_ask_salary_trend(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "How has our salary spend trended over the last 6 months?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "salary_trend"
        assert body["chart_type"] == "line"

    async def test_ask_custom_currency(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={
                "question": "What is our total salary spend this month?",
                "context": {"currency": "EUR"},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["currency"] == "EUR"
        assert "EUR" in body["answer_text"]

    async def test_ask_unsupported_question(self, client: AsyncClient, sample_ai_data):
        resp = await client.post(
            "/api/v1/ai/ask",
            json={"question": "Can you write a poem about green apples?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["metric_type"] == "unsupported"
        assert body["chart_type"] == "none"
        assert "couldn't match this question" in body["answer_text"]

