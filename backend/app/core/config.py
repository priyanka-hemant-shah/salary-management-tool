"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    secret_key: str = "dev-secret-key-change-in-production"

    # Database
    database_url: str = "sqlite+aiosqlite:///./acme_salary.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    # AI / Gemini
    gemini_api_key: str = ""

    @property
    def demo_mode(self) -> bool:
        """AI runs in demo mode when no API key is configured."""
        return not bool(self.gemini_api_key)

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()

