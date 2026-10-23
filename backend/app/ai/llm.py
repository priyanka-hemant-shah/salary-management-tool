"""
LLM Provider interface for Google Gemini.

Supports structured query classification and narrative response generation.
Gracefully falls back to rule-based execution when no API key is provided or offline.
"""

import json
import logging
from typing import Any, Dict, Optional
import httpx

from app.ai.query_spec import QuerySpec, QueryType
from app.core.config import get_settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


class GeminiProvider:
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.gemini_api_key

    @property
    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def classify_and_generate(
        self, question: str, data_context: Dict[str, Any]
    ) -> Optional[str]:
        """
        Optional enhancement: if Gemini API key is configured,
        generate an executive narrative summary based on real retrieved data.
        """
        if not self.is_available:
            return None

        prompt = (
            f"You are an executive HR compensation analytics assistant for ACME Corp.\n"
            f"The user asked: '{question}'\n\n"
            f"Here is the verified data retrieved from the database:\n"
            f"{json.dumps(data_context, default=str)}\n\n"
            f"Provide a concise, professional 1-3 sentence summary answering their question accurately based only on this data."
        )

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{GEMINI_API_URL}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 200},
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text.strip() if text else None
        except Exception as e:
            logger.warning(f"Gemini API invocation failed, falling back to template formatter: {e}")
            return None

        return None

