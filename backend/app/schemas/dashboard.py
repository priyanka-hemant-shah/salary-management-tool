"""Pydantic schemas for the Dashboard API."""

from datetime import date
from typing import List

from pydantic import BaseModel, ConfigDict


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    headcount: int
    total_salary_spend: float
    avg_salary: float
    active_countries: int
    paid_ratio: float
    salary_month: date
    currency: str


class CountrySpendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    country: str
    total_spend: float
    employee_count: int
    percentage: float


class SalaryByCountryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[CountrySpendItem]
    salary_month: date
    currency: str


class SalaryTrendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: date
    month_label: str
    total_spend: float
    employee_count: int
    avg_salary: float


class SalaryTrendResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[SalaryTrendItem]
    currency: str


class RecentChangeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    name: str
    department: str
    country: str
    salary: float
    currency: str
    effective_date: date
    status: str


class RecentChangesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[RecentChangeItem]

