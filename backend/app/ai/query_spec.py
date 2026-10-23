"""
Allowlisted query specifications for AI analytics queries.

Ensures no arbitrary queries or raw SQL can be executed by the AI layer.
All operations map strictly to known AnalyticsService methods.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class QueryType(str, Enum):
    TOTAL_COST = "total_cost"
    AVG_SALARY = "avg_salary"
    MEDIAN_SALARY = "median_salary"
    HEADCOUNT = "headcount"
    TOP_COUNTRIES = "top_countries"
    TOP_DEPARTMENTS = "top_departments"
    SALARY_TREND = "salary_trend"
    DEPARTMENT_COMPARISON = "department_comparison"
    COUNTRY_COMPARISON = "country_comparison"
    GENERAL_OVERVIEW = "general_overview"
    UNSUPPORTED = "unsupported"


class QuerySpec(BaseModel):
    query_type: QueryType = QueryType.UNSUPPORTED
    country: Optional[str] = None
    department: Optional[str] = None
    countries: List[str] = Field(default_factory=list)
    departments: List[str] = Field(default_factory=list)
    months_count: int = 12
    month: Optional[str] = None
    currency: str = "USD"
    limit: int = 5

