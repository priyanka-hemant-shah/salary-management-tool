"""
PR 2 — ORM model tests.

Tests that:
- Employee and SalaryRecord can be created and queried.
- The unique constraint on (employee_id, salary_month) is enforced.
- The relationship between Employee and SalaryRecord works.
- Helper properties return expected values.
"""

from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.employee import Employee
from app.models.salary_record import SalaryRecord


# ---------------------------------------------------------------------------
# Employee tests
# ---------------------------------------------------------------------------

class TestEmployeeModel:
    async def test_create_employee(self, db_session):
        """Employee can be persisted and retrieved."""
        emp = Employee(
            employee_code="EMP-00001",
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@acme.example.com",
            department="Engineering",
            job_title="Senior Engineer",
            country="United States",
            hire_date=date(2020, 6, 15),
        )
        db_session.add(emp)
        await db_session.flush()

        assert emp.id is not None
        result = await db_session.execute(select(Employee).where(Employee.id == emp.id))
        fetched = result.scalar_one()
        assert fetched.employee_code == "EMP-00001"
        assert fetched.full_name == "Jane Smith"

    async def test_full_name_property(self, db_session):
        """full_name concatenates first and last name."""
        emp = Employee(
            employee_code="EMP-00002",
            first_name="John",
            last_name="Doe",
            email="john.doe@acme.example.com",
            department="Finance",
            job_title="Analyst",
            country="United Kingdom",
            hire_date=date(2021, 1, 10),
        )
        assert emp.full_name == "John Doe"

    async def test_employee_code_unique(self, db_session):
        """Two employees cannot share the same employee_code."""
        for i, email in enumerate(["a@acme.example.com", "b@acme.example.com"]):
            db_session.add(
                Employee(
                    employee_code="EMP-DUP",
                    first_name="Test",
                    last_name="User",
                    email=email,
                    department="HR",
                    job_title="Coordinator",
                    country="Germany",
                    hire_date=date(2022, 3, 1),
                )
            )
        with pytest.raises(IntegrityError):
            await db_session.flush()

    async def test_email_unique(self, db_session):
        """Two employees cannot share the same email."""
        for code in ["EMP-X1", "EMP-X2"]:
            db_session.add(
                Employee(
                    employee_code=code,
                    first_name="Test",
                    last_name="User",
                    email="dup@acme.example.com",
                    department="Sales",
                    job_title="Rep",
                    country="Canada",
                    hire_date=date(2023, 1, 1),
                )
            )
        with pytest.raises(IntegrityError):
            await db_session.flush()


# ---------------------------------------------------------------------------
# SalaryRecord tests
# ---------------------------------------------------------------------------

@pytest.fixture
async def sample_employee(db_session) -> Employee:
    """A persisted employee for use in salary record tests."""
    emp = Employee(
        employee_code="EMP-SR-01",
        first_name="Alice",
        last_name="Test",
        email="alice.test@acme.example.com",
        department="Product",
        job_title="PM",
        country="Australia",
        hire_date=date(2019, 7, 1),
    )
    db_session.add(emp)
    await db_session.flush()
    return emp


class TestSalaryRecordModel:
    async def test_create_salary_record(self, db_session, sample_employee):
        """SalaryRecord can be persisted and retrieved."""
        record = SalaryRecord(
            employee_id=sample_employee.id,
            salary_month=date(2024, 1, 1),
            base_salary=95_000.00,
            currency="AUD",
            is_paid=True,
            paid_date=date(2024, 1, 31),
        )
        db_session.add(record)
        await db_session.flush()

        assert record.id is not None
        result = await db_session.execute(
            select(SalaryRecord).where(SalaryRecord.id == record.id)
        )
        fetched = result.scalar_one()
        assert fetched.base_salary == 95_000.00
        assert fetched.currency == "AUD"
        assert fetched.is_paid is True

    async def test_month_label_property(self, db_session, sample_employee):
        """month_label returns human-readable month string."""
        record = SalaryRecord(
            employee_id=sample_employee.id,
            salary_month=date(2024, 3, 1),
            base_salary=90_000.00,
            currency="AUD",
            is_paid=False,
        )
        assert record.month_label == "Mar 2024"

    async def test_unique_employee_month_constraint(self, db_session, sample_employee):
        """An employee cannot have two records for the same month."""
        for _ in range(2):
            db_session.add(
                SalaryRecord(
                    employee_id=sample_employee.id,
                    salary_month=date(2024, 4, 1),
                    base_salary=80_000.00,
                    currency="AUD",
                    is_paid=False,
                )
            )
        with pytest.raises(IntegrityError):
            await db_session.flush()

    async def test_employee_relationship(self, db_session, sample_employee):
        """SalaryRecord.employee navigates back to the owning Employee."""
        record = SalaryRecord(
            employee_id=sample_employee.id,
            salary_month=date(2024, 5, 1),
            base_salary=92_000.00,
            currency="AUD",
            is_paid=True,
            paid_date=date(2024, 5, 31),
        )
        db_session.add(record)
        await db_session.flush()

        result = await db_session.execute(
            select(SalaryRecord).where(SalaryRecord.id == record.id)
        )
        fetched = result.scalar_one()
        # Lazy loading doesn't work in async — explicitly refresh with relationship
        await db_session.refresh(fetched, ["employee"])
        assert fetched.employee.employee_code == "EMP-SR-01"

    async def test_cascade_delete(self, db_session, sample_employee):
        """Deleting an employee cascades to their salary records."""
        record = SalaryRecord(
            employee_id=sample_employee.id,
            salary_month=date(2024, 6, 1),
            base_salary=88_000.00,
            currency="AUD",
            is_paid=False,
        )
        db_session.add(record)
        await db_session.flush()
        record_id = record.id

        await db_session.delete(sample_employee)
        await db_session.flush()

        result = await db_session.execute(
            select(SalaryRecord).where(SalaryRecord.id == record_id)
        )
        assert result.scalar_one_or_none() is None

