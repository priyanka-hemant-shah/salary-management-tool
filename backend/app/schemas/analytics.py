"""Pydantic schemas for the Analytics API."""

from datetime import date
from typing import List

from pydantic import BaseModel, ConfigDict


class AnalyticsOverviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_spend: float
    avg_salary: float
    median_salary: float
    headcount: int
    highest_salary: float
    lowest_salary: float
    currency: str
    salary_month: date


class CountryAnalyticsItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    country: str
    headcount: int
    total_spend: float
    avg_salary: float
    median_salary: float
    percentage_of_total: float


class CountryAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[CountryAnalyticsItem]
    salary_month: date
    currency: str


class DepartmentAnalyticsItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department: str
    headcount: int
    total_spend: float
    avg_salary: float
    median_salary: float
    percentage_of_total: float


class DepartmentAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[DepartmentAnalyticsItem]
    salary_month: date
    currency: str


class AnalyticsTrendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: date
    month_label: str
    category: str
    total_spend: float
    avg_salary: float
    headcount: int


class AnalyticsTrendsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[AnalyticsTrendItem]
    group_by: str
    currency: str

