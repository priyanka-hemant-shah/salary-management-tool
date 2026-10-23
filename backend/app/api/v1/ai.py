"""
AI Salary Query API — v1

Endpoints:
----------
POST /api/v1/ai/ask                Natural language salary question answering
GET  /api/v1/ai/suggested-questions Starter questions for the chat interface
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.service import AIService
from app.core.database import get_db
from app.schemas.ai import AIAskRequest, AIAskResponse, SuggestedQuestionsResponse

router = APIRouter(prefix="/ai", tags=["AI Query Foundation"])


@router.post("/ask", response_model=AIAskResponse, summary="Ask salary question in natural language")
async def ask_salary_question(
    req: AIAskRequest,
    db: AsyncSession = Depends(get_db),
) -> AIAskResponse:
    """
    Submit a natural language salary question (e.g. 'What is our total spend this month?').
    Returns verified database-backed figures, executive answer text, and chart specifications.
    Operates in deterministic Demo Mode when no LLM key is configured.
    """
    return await AIService.ask_salary_question(
        db=db,
        question=req.question,
        context=req.context,
    )


@router.get(
    "/suggested-questions",
    response_model=SuggestedQuestionsResponse,
    summary="Get sample suggested salary questions",
)
async def get_suggested_questions() -> SuggestedQuestionsResponse:
    """Return pre-configured sample questions to populate chat prompt suggestions."""
    return SuggestedQuestionsResponse(questions=AIService.get_suggested_questions())

