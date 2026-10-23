"""Pydantic v2 schemas for the Employees API."""

import math
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, computed_field


# ---------------------------------------------------------------------------
# Salary record (embedded in employee responses)
# ---------------------------------------------------------------------------

class SalaryRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    salary_month: date
    base_salary: float
    currency: str
    is_paid: bool
    paid_date: Optional[date] = None

    @computed_field
    @property
    def month_label(self) -> str:
        return self.salary_month.strftime("%b %Y")


# ---------------------------------------------------------------------------
# Employee — base fields shared by list and detail responses
# ---------------------------------------------------------------------------

class EmployeeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    department: str
    job_title: str
    country: str
    hire_date: date

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


# ---------------------------------------------------------------------------
# Employee list item — one record per employee for the requested month
# ---------------------------------------------------------------------------

class EmployeeListItem(EmployeeBase):
    """Returned in the paginated list. Includes salary info for one month."""

    salary: Optional[SalaryRecordOut] = None


# ---------------------------------------------------------------------------
# Employee detail — all salary records
# ---------------------------------------------------------------------------

class EmployeeDetail(EmployeeBase):
    """Returned for GET /employees/{id}. Includes full salary history."""

    salary_records: list[SalaryRecordOut] = []


# ---------------------------------------------------------------------------
# Pagination meta
# ---------------------------------------------------------------------------

class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def build(cls, total: int, page: int, page_size: int) -> "PaginationMeta":
        pages = math.ceil(total / page_size) if total > 0 else 0
        return cls(total=total, page=page, page_size=page_size, pages=pages)


# ---------------------------------------------------------------------------
# Paginated response wrapper
# ---------------------------------------------------------------------------

class EmployeeListResponse(BaseModel):
    """Top-level response for GET /employees."""

    data: list[EmployeeListItem]
    meta: PaginationMeta
    # The month whose salary data is embedded in each item
    salary_month: date


# ---------------------------------------------------------------------------
# Distinct-values responses (for filter dropdowns)
# ---------------------------------------------------------------------------

class CountriesResponse(BaseModel):
    countries: list[str]


class MonthsResponse(BaseModel):
    months: list[str]  # ISO format "YYYY-MM-DD" (first of each month)

