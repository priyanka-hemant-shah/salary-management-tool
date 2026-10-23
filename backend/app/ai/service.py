"""
AI Salary Query Orchestrator Service.

Pipeline:
1. Parse question and extract query intent & entities (rule-based matcher or Gemini).
2. Validate query against strict allowlist (no raw SQL).
3. Execute DB-backed query via the centralized AnalyticsService.
4. Format structured response with chart metadata, tabular data, and executive summary.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import GeminiProvider
from app.ai.matcher import classify_question
from app.ai.query_spec import QuerySpec, QueryType
from app.core.config import get_settings
from app.schemas.ai import AIAskContext, AIAskResponse
from app.services.analytics import AnalyticsService, get_latest_salary_month

SUGGESTED_QUESTIONS = [
    "What is our total salary spend this month?",
    "Which country has the highest average salary?",
    "What is the median salary in the United States?",
    "Compare Engineering vs Marketing salary costs",
    "How has our salary spend trended over the last 6 months?",
    "What is the breakdown of salaries by department?",
]


class AIService:
    @staticmethod
    async def ask_salary_question(
        db: AsyncSession, question: str, context: Optional[AIAskContext] = None
    ) -> AIAskResponse:
        settings = get_settings()
        currency = context.currency if context and context.currency else "USD"
        month = context.month if context and context.month else None

        # 1. Classify question using allowlisted matcher
        query_spec: QuerySpec = classify_question(question, default_currency=currency)

        # Context overrides if explicitly supplied
        if context:
            if context.country and not query_spec.country:
                query_spec.country = context.country
            if context.department and not query_spec.department:
                query_spec.department = context.department
            if context.month:
                query_spec.month = context.month

        # Fallback to latest month if none specified
        if not query_spec.month:
            latest_date = await get_latest_salary_month(db)
            query_spec.month = latest_date.strftime("%Y-%m")

        # 2. Execute DB analytics through verified AnalyticsService
        data_records: List[Dict[str, Any]] = []
        answer_text = ""
        chart_type = "none"
        metric_type = query_spec.query_type.value
        followups: List[str] = []

        if query_spec.query_type == QueryType.TOTAL_COST:
            overview = await AnalyticsService.get_analytics_overview(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                department=query_spec.department,
                currency=currency,
            )
            entity_label = ""
            if query_spec.country and query_spec.department:
                entity_label = f" for {query_spec.department} in {query_spec.country}"
            elif query_spec.country:
                entity_label = f" in {query_spec.country}"
            elif query_spec.department:
                entity_label = f" in the {query_spec.department} department"

            answer_text = (
                f"In {query_spec.month}, ACME Corp's total salary spend{entity_label} was "
                f"{currency} {overview.total_spend:,.2f} across {overview.headcount:,} employees."
            )
            data_records = [overview.model_dump()]
            chart_type = "metric"
            followups = [
                f"What is the average salary in {query_spec.month}?",
                "Which country has the highest average salary?",
            ]

        elif query_spec.query_type == QueryType.AVG_SALARY:
            overview = await AnalyticsService.get_analytics_overview(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                department=query_spec.department,
                currency=currency,
            )
            entity_label = ""
            if query_spec.country and query_spec.department:
                entity_label = f" for {query_spec.department} in {query_spec.country}"
            elif query_spec.country:
                entity_label = f" in {query_spec.country}"
            elif query_spec.department:
                entity_label = f" in the {query_spec.department} department"

            answer_text = (
                f"The average monthly salary{entity_label} for {query_spec.month} was "
                f"{currency} {overview.avg_salary:,.2f} (headcount: {overview.headcount:,})."
            )
            data_records = [overview.model_dump()]
            chart_type = "metric"
            followups = [
                f"What is the median salary{entity_label}?",
                "Show salary breakdown by department",
            ]

        elif query_spec.query_type == QueryType.MEDIAN_SALARY:
            overview = await AnalyticsService.get_analytics_overview(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                department=query_spec.department,
                currency=currency,
            )
            entity_label = ""
            if query_spec.country:
                entity_label = f" in {query_spec.country}"
            elif query_spec.department:
                entity_label = f" for {query_spec.department}"

            answer_text = (
                f"The median monthly salary{entity_label} for {query_spec.month} was "
                f"{currency} {overview.median_salary:,.2f} (Average: {currency} {overview.avg_salary:,.2f})."
            )
            data_records = [overview.model_dump()]
            chart_type = "metric"
            followups = [
                f"What is the highest and lowest salary{entity_label}?",
                "How has our salary spend trended over the last 6 months?",
            ]

        elif query_spec.query_type == QueryType.HEADCOUNT:
            overview = await AnalyticsService.get_analytics_overview(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                department=query_spec.department,
                currency=currency,
            )
            entity_label = ""
            if query_spec.country and query_spec.department:
                entity_label = f" in {query_spec.department} ({query_spec.country})"
            elif query_spec.country:
                entity_label = f" in {query_spec.country}"
            elif query_spec.department:
                entity_label = f" in {query_spec.department}"

            answer_text = (
                f"ACME Corp has {overview.headcount:,} active employees{entity_label} "
                f"recorded for {query_spec.month}."
            )
            data_records = [overview.model_dump()]
            chart_type = "metric"
            followups = [
                "What is our total salary spend this month?",
                "Which department has the most employees?",
            ]

        elif query_spec.query_type == QueryType.TOP_COUNTRIES:
            resp = await AnalyticsService.get_by_country_analytics(
                db=db,
                month_str=query_spec.month,
                department=query_spec.department,
                currency=currency,
            )
            data_records = [item.model_dump() for item in resp.items[: query_spec.limit]]
            if data_records:
                top = data_records[0]
                answer_text = (
                    f"In {query_spec.month}, the top country by total spend was {top['country']} "
                    f"with {currency} {top['total_spend']:,.2f} ({top['percentage_of_total']}% of total) "
                    f"and an average salary of {currency} {top['avg_salary']:,.2f}."
                )
            else:
                answer_text = f"No country salary records found for {query_spec.month}."
            chart_type = "bar"
            followups = [
                "What is the median salary in the United States?",
                "Compare Engineering vs Marketing salary costs",
            ]

        elif query_spec.query_type == QueryType.TOP_DEPARTMENTS:
            resp = await AnalyticsService.get_by_department_analytics(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                currency=currency,
            )
            data_records = [item.model_dump() for item in resp.items[: query_spec.limit]]
            if data_records:
                top = data_records[0]
                answer_text = (
                    f"In {query_spec.month}, {top['department']} had the highest department spend "
                    f"at {currency} {top['total_spend']:,.2f} with {top['headcount']:,} employees "
                    f"(avg {currency} {top['avg_salary']:,.2f})."
                )
            else:
                answer_text = f"No department salary records found for {query_spec.month}."
            chart_type = "bar"
            followups = [
                "Compare Engineering vs Marketing salary costs",
                "What is our total salary spend this month?",
            ]

        elif query_spec.query_type == QueryType.DEPARTMENT_COMPARISON:
            resp = await AnalyticsService.get_by_department_analytics(
                db=db, month_str=query_spec.month, currency=currency
            )
            matched = [
                i.model_dump()
                for i in resp.items
                if i.department.lower() in [d.lower() for d in query_spec.departments]
            ]
            data_records = matched if matched else [i.model_dump() for i in resp.items[:4]]
            if len(data_records) >= 2:
                d1, d2 = data_records[0], data_records[1]
                answer_text = (
                    f"Comparison for {query_spec.month}: {d1['department']} has {d1['headcount']} employees "
                    f"costing {currency} {d1['total_spend']:,.2f} (avg {currency} {d1['avg_salary']:,.2f}), while "
                    f"{d2['department']} has {d2['headcount']} employees costing {currency} {d2['total_spend']:,.2f} "
                    f"(avg {currency} {d2['avg_salary']:,.2f})."
                )
            else:
                answer_text = f"Department comparison data compiled for {query_spec.month}."
            chart_type = "bar"
            followups = [
                "Show salary breakdown by department",
                "How has our salary spend trended over the last 6 months?",
            ]

        elif query_spec.query_type == QueryType.COUNTRY_COMPARISON:
            resp = await AnalyticsService.get_by_country_analytics(
                db=db, month_str=query_spec.month, currency=currency
            )
            matched = [
                i.model_dump()
                for i in resp.items
                if i.country.lower() in [c.lower() for c in query_spec.countries]
            ]
            data_records = matched if matched else [i.model_dump() for i in resp.items[:4]]
            if len(data_records) >= 2:
                c1, c2 = data_records[0], data_records[1]
                answer_text = (
                    f"Country comparison for {query_spec.month}: {c1['country']} has {c1['headcount']} employees "
                    f"totaling {currency} {c1['total_spend']:,.2f} (avg {currency} {c1['avg_salary']:,.2f}), whereas "
                    f"{c2['country']} has {c2['headcount']} employees totaling {currency} {c2['total_spend']:,.2f} "
                    f"(avg {currency} {c2['avg_salary']:,.2f})."
                )
            else:
                answer_text = f"Country comparison data compiled for {query_spec.month}."
            chart_type = "bar"
            followups = [
                "Which country has the highest average salary?",
                "What is our total salary spend this month?",
            ]

        elif query_spec.query_type == QueryType.SALARY_TREND:
            trend_resp = await AnalyticsService.get_salary_trend(
                db=db, months_count=query_spec.months_count, currency=currency
            )
            data_records = [item.model_dump() for item in trend_resp.items]
            if data_records:
                first = data_records[0]
                last = data_records[-1]
                answer_text = (
                    f"Over the past {len(data_records)} months, total monthly salary spend moved from "
                    f"{currency} {first['total_spend']:,.2f} ({first['month_label']}) to "
                    f"{currency} {last['total_spend']:,.2f} ({last['month_label']})."
                )
            else:
                answer_text = "No historical trend data available."
            chart_type = "line"
            followups = [
                "What is our total salary spend this month?",
                "Which country has the highest average salary?",
            ]

        elif query_spec.query_type == QueryType.GENERAL_OVERVIEW:
            overview = await AnalyticsService.get_analytics_overview(
                db=db,
                month_str=query_spec.month,
                country=query_spec.country,
                department=query_spec.department,
                currency=currency,
            )
            entity_label = ""
            if query_spec.country:
                entity_label = f" for {query_spec.country}"
            elif query_spec.department:
                entity_label = f" for the {query_spec.department} team"

            answer_text = (
                f"Summary{entity_label} ({query_spec.month}): Headcount is {overview.headcount:,}, "
                f"total spend is {currency} {overview.total_spend:,.2f}, with an average salary of "
                f"{currency} {overview.avg_salary:,.2f} and median of {currency} {overview.median_salary:,.2f}."
            )
            data_records = [overview.model_dump()]
            chart_type = "metric"
            followups = [
                "What is our total salary spend this month?",
                "Show salary breakdown by department",
            ]

        else:
            # UNSUPPORTED
            answer_text = (
                "I couldn't match this question to an authorized salary analysis query. "
                "Try asking about total salary spend, average or median salaries by country/department, "
                "or salary trends over past months."
            )
            chart_type = "none"
            followups = SUGGESTED_QUESTIONS[:3]

        # 3. Optional enhancement: if Gemini API is available, ask Gemini to enrich the narrative summary
        source = "rule_based"
        is_demo_mode = settings.demo_mode

        if not is_demo_mode:
            provider = GeminiProvider()
            if provider.is_available and data_records:
                enhanced_text = await provider.classify_and_generate(
                    question=question,
                    data_context={
                        "month": query_spec.month,
                        "currency": currency,
                        "data": data_records,
                    },
                )
                if enhanced_text:
                    answer_text = enhanced_text
                    source = "llm"

        return AIAskResponse(
            question=question,
            answer_text=answer_text,
            metric_type=metric_type,
            data=data_records,
            chart_type=chart_type,
            period=query_spec.month,
            currency=currency,
            source=source,
            is_demo_mode=is_demo_mode,
            suggested_followups=followups,
        )

    @staticmethod
    def get_suggested_questions() -> List[str]:
        return SUGGESTED_QUESTIONS

