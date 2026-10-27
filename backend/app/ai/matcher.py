"""
Deterministic rule-based query classifier and entity extractor.

Used in Demo Mode or when LLM API keys are not configured.
Matches natural language queries against known HR questions and patterns.
"""

import re
from typing import List, Optional, Tuple
from app.ai.query_spec import QuerySpec, QueryType

# Canonical lists
KNOWN_COUNTRIES = {
    "united states": "United States",
    "us": "United States",
    "usa": "United States",
    "united kingdom": "United Kingdom",
    "uk": "United Kingdom",
    "germany": "Germany",
    "france": "France",
    "india": "India",
    "singapore": "Singapore",
    "australia": "Australia",
    "canada": "Canada",
    "japan": "Japan",
    "brazil": "Brazil",
}

KNOWN_DEPARTMENTS = {
    "engineering": "Engineering",
    "marketing": "Marketing",
    "sales": "Sales",
    "human resources": "Human Resources",
    "hr": "Human Resources",
    "finance": "Finance",
    "operations": "Operations",
    "legal": "Legal",
    "product": "Product",
    "design": "Design",
    "customer success": "Customer Success",
}

KNOWN_CURRENCIES = {
    "usd": "USD",
    "$": "USD",
    "eur": "EUR",
    "euro": "EUR",
    "euros": "EUR",
    "€": "EUR",
    "gbp": "GBP",
    "pound": "GBP",
    "pounds": "GBP",
    "£": "GBP",
    "inr": "INR",
    "rupee": "INR",
    "rupees": "INR",
    "cad": "CAD",
    "aud": "AUD",
    "jpy": "JPY",
    "yen": "JPY",
    "sgd": "SGD",
    "brl": "BRL",
}


def extract_entities(question: str) -> Tuple[List[str], List[str], Optional[str], int]:
    """Extract countries, departments, currency, and month count from query."""
    q_lower = question.lower()

    # Find countries
    found_countries = []
    # Check multi-word first
    for alias, canonical in sorted(KNOWN_COUNTRIES.items(), key=lambda x: -len(x[0])):
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, q_lower):
            if canonical not in found_countries:
                found_countries.append(canonical)

    # Find departments
    found_departments = []
    for alias, canonical in sorted(KNOWN_DEPARTMENTS.items(), key=lambda x: -len(x[0])):
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, q_lower):
            if canonical not in found_departments:
                found_departments.append(canonical)

    # Find currency
    currency = None
    for sym, code in KNOWN_CURRENCIES.items():
        if sym in ["$", "€", "£"]:
            if sym in question:
                currency = code
                break
        else:
            if re.search(r"\b" + re.escape(sym) + r"\b", q_lower):
                currency = code
                break

    # Find months count
    months_count = 12
    m_match = re.search(r"\b(\d+)\s*(?:months?|mos?)\b", q_lower)
    if m_match:
        try:
            val = int(m_match.group(1))
            if 1 <= val <= 36:
                months_count = val
        except ValueError:
            pass

    return found_countries, found_departments, currency, months_count


def classify_question(question: str, default_currency: str = "USD") -> QuerySpec:
    """Classify natural language question into an allowlisted QuerySpec."""
    q_lower = question.lower().strip()
    countries, departments, currency, months_count = extract_entities(question)
    curr = currency or default_currency

    country = countries[0] if countries else None
    department = departments[0] if departments else None

    # 1. Trend queries (e.g. "trend", "over time", "last 6 months", "history")
    if any(k in q_lower for k in ["trend", "over time", "history", "monthly progression", "past months", "last "]):
        return QuerySpec(
            query_type=QueryType.SALARY_TREND,
            country=country,
            department=department,
            months_count=months_count,
            currency=curr,
        )

    # 2. Comparisons (e.g. "compare engineering vs marketing", "difference between US and UK")
    if "compare" in q_lower or " vs " in q_lower or "versus" in q_lower:
        if len(departments) >= 2:
            return QuerySpec(
                query_type=QueryType.DEPARTMENT_COMPARISON,
                departments=departments,
                currency=curr,
            )
        if len(countries) >= 2:
            return QuerySpec(
                query_type=QueryType.COUNTRY_COMPARISON,
                countries=countries,
                currency=curr,
            )

    # 3. Top / Highest / Lowest queries
    if any(k in q_lower for k in ["which country", "highest country", "top country", "highest paying country", "top paying country", "highest average country"]):
        return QuerySpec(
            query_type=QueryType.TOP_COUNTRIES,
            department=department,
            currency=curr,
            limit=5,
        )

    if any(k in q_lower for k in ["which department", "highest department", "top department", "highest paying department", "top paying department"]):
        return QuerySpec(
            query_type=QueryType.TOP_DEPARTMENTS,
            country=country,
            currency=curr,
            limit=5,
        )

    # 4. Median salary queries
    if "median" in q_lower:
        return QuerySpec(
            query_type=QueryType.MEDIAN_SALARY,
            country=country,
            department=department,
            currency=curr,
        )

    # 5. Average salary queries
    if any(k in q_lower for k in ["average", "avg", "mean", "typical"]):
        # If asks about countries generally
        if "by country" in q_lower or "each country" in q_lower:
            return QuerySpec(
                query_type=QueryType.TOP_COUNTRIES,
                department=department,
                currency=curr,
                limit=10,
            )
        # If asks about departments generally
        if "by department" in q_lower or "each department" in q_lower:
            return QuerySpec(
                query_type=QueryType.TOP_DEPARTMENTS,
                country=country,
                currency=curr,
                limit=10,
            )
        return QuerySpec(
            query_type=QueryType.AVG_SALARY,
            country=country,
            department=department,
            currency=curr,
        )

    # 6. Total spend / cost queries
    if any(k in q_lower for k in ["total", "spend", "cost", "payroll", "budget", "payout", "bill", "expenditure", "breakdown", "distribution"]):
        if "by country" in q_lower or "each country" in q_lower or ("country" in q_lower and "breakdown" in q_lower):
            return QuerySpec(
                query_type=QueryType.TOP_COUNTRIES,
                department=department,
                currency=curr,
                limit=10,
            )
        if "by department" in q_lower or "each department" in q_lower or ("department" in q_lower and "breakdown" in q_lower):
            return QuerySpec(
                query_type=QueryType.TOP_DEPARTMENTS,
                country=country,
                currency=curr,
                limit=10,
            )
        return QuerySpec(
            query_type=QueryType.TOTAL_COST,
            country=country,
            department=department,
            currency=curr,
        )

    # 7. Headcount queries
    if any(k in q_lower for k in ["how many", "headcount", "number of employees", "staff", "workforce", "employee count"]):
        if "department" in q_lower and not department:
            return QuerySpec(
                query_type=QueryType.TOP_DEPARTMENTS,
                country=country,
                currency=curr,
                limit=10,
            )
        if "country" in q_lower and not country:
            return QuerySpec(
                query_type=QueryType.TOP_COUNTRIES,
                department=department,
                currency=curr,
                limit=10,
            )
        return QuerySpec(
            query_type=QueryType.HEADCOUNT,
            country=country,
            department=department,
            currency=curr,
        )

    # 8. Department or country mentioned alone (e.g., "Engineering salaries", "United States")
    if country or department:
        return QuerySpec(
            query_type=QueryType.GENERAL_OVERVIEW,
            country=country,
            department=department,
            currency=curr,
        )

    # 9. Generic query
    if any(k in q_lower for k in ["summary", "overview", "salary", "compensation"]):
        return QuerySpec(
            query_type=QueryType.GENERAL_OVERVIEW,
            currency=curr,
        )

    return QuerySpec(
        query_type=QueryType.UNSUPPORTED,
        currency=curr,
    )

