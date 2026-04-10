from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://localhost/dastan"
    APP_NAME: str = "Dastan"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SUPABASE_URL: str = ""

    model_config = {"env_prefix": "DASTAN_", "env_file": ".env"}


settings = Settings()
