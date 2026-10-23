"""Pydantic schemas for the AI Salary Query Engine."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AIAskContext(BaseModel):
    month: Optional[str] = Field(None, description="Month in YYYY-MM format")
    currency: str = Field("USD", description="Target reporting currency")
    country: Optional[str] = Field(None, description="Country filter if any")
    department: Optional[str] = Field(None, description="Department filter if any")


class AIAskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500, description="Natural language salary question")
    context: Optional[AIAskContext] = Field(default_factory=AIAskContext)


class AIAskResponse(BaseModel):
    question: str
    answer_text: str
    metric_type: str
    data: List[Dict[str, Any]] = Field(default_factory=list)
    chart_type: str = Field("none", description="metric | bar | donut | line | table | none")
    period: Optional[str] = None
    currency: str = "USD"
    source: str = Field("rule_based", description="llm | rule_based | fallback")
    is_demo_mode: bool = True
    suggested_followups: List[str] = Field(default_factory=list)


class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]

