import json
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

    s3_bucket: Optional[str] = Field(default=None, env="S3_BUCKET")
    s3_region: Optional[str] = Field(default=None, env="S3_REGION")
    s3_endpoint: Optional[str] = Field(default=None, env="S3_ENDPOINT")
    s3_access_key: Optional[str] = Field(default=None, env="S3_ACCESS_KEY")
    s3_secret_key: Optional[str] = Field(default=None, env="S3_SECRET_KEY")
    s3_use_path_style: bool = Field(default=False, env="S3_USE_PATH_STYLE")
    s3_public_base_url: Optional[str] = Field(default=None, env="S3_PUBLIC_BASE_URL")
    s3_prefix: Optional[str] = Field(default=None, env="S3_KEY_PREFIX")
    s3_presign_expire_seconds: int = Field(default=300, env="S3_PRESIGN_EXPIRE_SECONDS")
    s3_signature_version: str = Field(default="s3v4", env="S3_SIGNATURE_VERSION")

    display_currency: str = Field("USD", env="DISPLAY_CURRENCY")
    currency_exchange_rates: dict[str, float] = Field(
        default_factory=lambda: {"USD": 1.0}, env="CURRENCY_EXCHANGE_RATES"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("cors_origins", pre=True)
    def split_cors_origins(cls, value: Optional[str]):  # type: ignore[override]
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @validator("s3_prefix", pre=True)
    def normalize_prefix(cls, value: Optional[str]):  # type: ignore[override]
        if not value:
            return None
        trimmed = value.strip().strip("/")
        return f"{trimmed}/" if trimmed else None

    @validator("s3_public_base_url", pre=True)
    def normalize_public_base(cls, value: Optional[str]):  # type: ignore[override]
        if not value:
            return None
        trimmed = value.strip()
        return trimmed.rstrip("/") or None

    @validator("display_currency", pre=True)
    def normalize_display_currency(cls, value: Optional[str]):  # type: ignore[override]
        if not value:
            return "USD"
        return str(value).strip().upper() or "USD"

    @validator("currency_exchange_rates", pre=True)
    def parse_exchange_rates(cls, value):  # type: ignore[override]
        if value in (None, "", {}):
            return {"USD": 1.0}

        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return {"USD": 1.0}
            try:
                parsed = json.loads(stripped)
            except json.JSONDecodeError:
                items: dict[str, float] = {}
                separators = [",", "\n", ";"]
                parts: list[str] = [stripped]
                for separator in separators:
                    if separator in stripped:
                        parts = [part for chunk in parts for part in chunk.split(separator)]
                for part in parts:
                    if not part.strip():
                        continue
                    if "=" in part:
                        key, raw_rate = part.split("=", 1)
                    elif ":" in part:
                        key, raw_rate = part.split(":", 1)
                    else:
                        continue
                    try:
                        rate = float(raw_rate.strip())
                    except (TypeError, ValueError):
                        continue
                    if rate > 0:
                        items[key.strip().upper()] = rate
                if items:
                    return items
                raise ValueError("Invalid currency exchange rate format")
            else:
                if isinstance(parsed, dict):
                    value = parsed
                else:
                    raise ValueError("Currency exchange rates must be a JSON object")

        if isinstance(value, dict):
            cleaned: dict[str, float] = {}
            for key, raw_rate in value.items():
                if key is None:
                    continue
                try:
                    rate = float(raw_rate)
                except (TypeError, ValueError):
                    continue
                if rate > 0:
                    cleaned[str(key).strip().upper()] = rate
            return cleaned or {"USD": 1.0}

        raise ValueError("Currency exchange rates must be a mapping or JSON string")

    @validator("currency_exchange_rates")
    def ensure_display_currency_rate(
        cls, value: dict[str, float], values: dict[str, object]
    ):  # type: ignore[override]
        display_currency = str(values.get("display_currency", "USD")).upper()
        normalized = {code.upper(): rate for code, rate in value.items()}
        if display_currency not in normalized:
            normalized[display_currency] = 1.0
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
