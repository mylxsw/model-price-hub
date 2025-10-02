from functools import lru_cache
from typing import List, Optional

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    environment: str = Field("development", env="ENVIRONMENT")
    database_url: str = Field("sqlite:///./app.db", env="DATABASE_URL")
    echo_sql: bool = Field(False, env="ECHO_SQL")

    secret_key: str = Field("change-me", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(60 * 24, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    admin_username: str = Field("admin", env="ADMIN_USERNAME")
    admin_password_hash: str = Field("", env="ADMIN_PASSWORD_HASH")

    cors_origins: List[str] = Field(default_factory=lambda: ["*"])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("cors_origins", pre=True)
    def split_cors_origins(cls, value: Optional[str]):  # type: ignore[override]
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
