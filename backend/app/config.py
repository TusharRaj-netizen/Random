"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

load_dotenv()


def _split_origins(raw: str) -> List[str]:
    """Parse a comma-separated list of origins into a clean list."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings:
    """Strongly-typed runtime settings for the application."""

    gemini_api_key: str
    gemini_model: str
    host: str
    port: int
    cors_origins: List[str]
    environment: str

    def __init__(self) -> None:
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))
        self.cors_origins = _split_origins(
            os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        )
        self.environment = os.getenv("ENVIRONMENT", "development")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def gemini_available(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton settings instance."""
    return Settings()


settings = get_settings()