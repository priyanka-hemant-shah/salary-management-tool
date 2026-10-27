"""
Seed script — generates 10,000 synthetic ACME employees and 12 months of
salary records for each (120,000 salary_records total).

Usage (from backend/ directory, with venv active):
    python scripts/seed.py            # fresh seed (drops & recreates tables)
    python scripts/seed.py --no-drop  # append-only (skip if data exists)
"""

import argparse
import asyncio
import random
import sys
from datetime import date, timedelta
from pathlib import Path

# Ensure the backend package root is on the path when run as a script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faker import Faker
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import Base
from app.models.employee import Employee
from app.models.salary_record import SalaryRecord

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TOTAL_EMPLOYEES = 10_000
MONTHS_OF_HISTORY = 12        # generate 12 monthly pay records per employee
BATCH_SIZE = 500              # rows per INSERT batch

fake = Faker()
rng = random.Random(42)       # fixed seed → reproducible dataset

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------
COUNTRIES = [
    ("United States", "USD", (80_000, 220_000)),
    ("United Kingdom", "GBP", (55_000, 160_000)),
    ("Germany", "EUR", (60_000, 170_000)),
    ("France", "EUR", (50_000, 150_000)),
    ("India", "INR", (1_200_000, 5_000_000)),
    ("Singapore", "SGD", (70_000, 200_000)),
    ("Australia", "AUD", (75_000, 210_000)),
    ("Canada", "CAD", (70_000, 190_000)),
    ("Japan", "JPY", (6_000_000, 18_000_000)),
    ("Brazil", "BRL", (80_000, 300_000)),
]

# Weights so US/India/UK have more employees (realistic distribution)
COUNTRY_WEIGHTS = [30, 15, 12, 8, 12, 5, 5, 5, 4, 4]

DEPARTMENTS = [
    "Engineering",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "Legal",
    "Product",
    "Design",
    "Customer Success",
]

JOB_TITLES_BY_DEPARTMENT: dict[str, list[str]] = {
    "Engineering": ["Junior Engineer", "Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager"],
    "Marketing": ["Marketing Coordinator", "Marketing Manager", "Senior Marketing Manager", "Marketing Director", "VP Marketing"],
    "Sales": ["Sales Development Rep", "Account Executive", "Senior AE", "Sales Manager", "VP Sales"],
    "Human Resources": ["HR Coordinator", "HR Business Partner", "Senior HRBP", "HR Manager", "HR Director"],
    "Finance": ["Financial Analyst", "Senior Analyst", "Finance Manager", "Controller", "CFO"],
    "Operations": ["Operations Analyst", "Operations Manager", "Senior Ops Manager", "Head of Operations", "COO"],
    "Legal": ["Legal Coordinator", "Associate Counsel", "Senior Counsel", "Legal Director", "General Counsel"],
    "Product": ["Product Analyst", "Product Manager", "Senior PM", "Group PM", "VP Product"],
    "Design": ["Junior Designer", "UX Designer", "Senior Designer", "Lead Designer", "Head of Design"],
    "Customer Success": ["CS Analyst", "Customer Success Manager", "Senior CSM", "CS Team Lead", "VP Customer Success"],
}

# First salary month to seed (12 months ago, normalised to 1st of month)
_today = date.today()
FIRST_MONTH = date(_today.year if _today.month > MONTHS_OF_HISTORY else _today.year - 1,
                   ((_today.month - MONTHS_OF_HISTORY - 1) % 12) + 1, 1)
SALARY_MONTHS = [
    date(
        (FIRST_MONTH.year + (FIRST_MONTH.month + i - 1) // 12),
        (FIRST_MONTH.month + i - 1) % 12 + 1,
        1,
    )
    for i in range(MONTHS_OF_HISTORY)
]
# Current month is unpaid; previous months are paid
CURRENT_MONTH = date(_today.year, _today.month, 1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pick_country():
    return rng.choices(COUNTRIES, weights=COUNTRY_WEIGHTS, k=1)[0]


def _salary_for(country_data: tuple, month_index: int) -> float:
    """Return a salary amount with a small monthly drift (+/- 0.5%)."""
    _, _, (lo, hi) = country_data
    base = rng.uniform(lo, hi)
    drift = 1 + rng.uniform(-0.005, 0.005) * month_index
    return round(base * drift, 2)


def _make_employee(seq: int) -> dict:
    country_data = _pick_country()
    country_name, _, _ = country_data
    department = rng.choice(DEPARTMENTS)
    job_title = rng.choice(JOB_TITLES_BY_DEPARTMENT[department])
    hire_date = fake.date_between(start_date="-10y", end_date="today")
    return {
        "employee_code": f"EMP-{seq:05d}",
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": f"emp{seq:05d}@acme-corp.example.com",
        "department": department,
        "job_title": job_title,
        "country": country_name,
        "hire_date": hire_date,
        "_country_data": country_data,   # ephemeral, stripped before insert
    }


# ---------------------------------------------------------------------------
# Core seeding logic
# ---------------------------------------------------------------------------

async def seed(drop: bool = True) -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)

    async with engine.begin() as conn:
        if drop:
            print("[*] Dropping and recreating all tables ...")
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        else:
            await conn.run_sync(Base.metadata.create_all)
            # Check if already seeded
            result = await conn.execute(text("SELECT COUNT(*) FROM employees"))
            count = result.scalar()
            if count and count > 0:
                print(f"[i] Database already contains {count} employees. Use --drop to reseed.")
                await engine.dispose()
                return

    Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    # ------------------------------------------------------------------
    # 1. Insert employees in batches
    # ------------------------------------------------------------------
    print(f"[*] Seeding {TOTAL_EMPLOYEES:,} employees ...")
    employee_country_map: list[tuple] = []   # (employee_id, country_data)

    raw_employees = [_make_employee(i + 1) for i in range(TOTAL_EMPLOYEES)]
    country_data_list = [e.pop("_country_data") for e in raw_employees]

    async with Session() as session:
        for start in range(0, TOTAL_EMPLOYEES, BATCH_SIZE):
            batch = raw_employees[start: start + BATCH_SIZE]
            objs = [Employee(**row) for row in batch]
            session.add_all(objs)
            await session.flush()
            # Capture the DB-assigned IDs
            for obj, cdata in zip(objs, country_data_list[start: start + BATCH_SIZE]):
                employee_country_map.append((obj.id, cdata))
            print(f"  employees: {min(start + BATCH_SIZE, TOTAL_EMPLOYEES):>6,} / {TOTAL_EMPLOYEES:,}", end="\r")
        await session.commit()

    print(f"\n[+] Employees inserted: {TOTAL_EMPLOYEES:,}")

    # ------------------------------------------------------------------
    # 2. Insert salary records in batches
    # ------------------------------------------------------------------
    total_records = TOTAL_EMPLOYEES * MONTHS_OF_HISTORY
    print(f"[*] Seeding {total_records:,} salary records ...")

    salary_batch: list[SalaryRecord] = []
    inserted = 0

    async with Session() as session:
        for emp_id, cdata in employee_country_map:
            _, currency, _ = cdata
            for i, month in enumerate(SALARY_MONTHS):
                # Realistic disbursement: latest month has ~8% pending/unpaid, previous has ~3%
                if i == len(SALARY_MONTHS) - 1:
                    is_paid = rng.random() >= 0.08
                elif i == len(SALARY_MONTHS) - 2:
                    is_paid = rng.random() >= 0.03
                else:
                    is_paid = rng.random() >= 0.01

                paid_date = (
                    month + timedelta(days=rng.randint(25, 28))
                    if is_paid
                    else None
                )
                salary_batch.append(
                    SalaryRecord(
                        employee_id=emp_id,
                        salary_month=month,
                        base_salary=_salary_for(cdata, i),
                        currency=currency,
                        is_paid=is_paid,
                        paid_date=paid_date,
                    )
                )

            if len(salary_batch) >= BATCH_SIZE:
                session.add_all(salary_batch)
                await session.flush()
                inserted += len(salary_batch)
                salary_batch = []
                print(f"  salary records: {inserted:>9,} / {total_records:,}", end="\r")

        if salary_batch:
            session.add_all(salary_batch)
            await session.flush()
            inserted += len(salary_batch)

        await session.commit()

    print(f"\n[+] Salary records inserted: {inserted:,}")
    await engine.dispose()
    print("[+] Seed complete!")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ACME salary database")
    parser.add_argument(
        "--no-drop",
        dest="drop",
        action="store_false",
        help="Do not drop tables; skip if data already exists.",
    )
    args = parser.parse_args()
    asyncio.run(seed(drop=args.drop))
