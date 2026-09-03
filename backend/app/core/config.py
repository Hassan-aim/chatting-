from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    log_level: str = "INFO"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    database_url: str = "mysql+aiomysql://chat:changeme@localhost:3306/private_chat"
    database_url_sync: str = ""

    @field_validator("database_url", "database_url_sync", mode="before")
    @classmethod
    def strip_database_url(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def derive_sync_url(self) -> "Settings":
        """Auto-derive database_url_sync and detect SSL from URLs."""
        if not self.database_url_sync:
            url = self.database_url
            url = url.replace("mysql+aiomysql://", "mysql+pymysql://")
            url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            url = url.replace("+aiomysql://", "+pymysql://")
            url = url.replace("+asyncpg://", "+psycopg2://")
            self.database_url_sync = url

        # Detect and strip ?ssl=true from URLs (pymysql doesn't understand it;
        # SSL is configured via connect_args instead).
        self.database_ssl = (
            "+ssl=true" in self.database_url.lower()
            or "?ssl=true" in self.database_url.lower()
        )
        self.database_url = self._strip_ssl_param(self.database_url)
        self.database_url_sync = self._strip_ssl_param(self.database_url_sync)
        return self

    @staticmethod
    def _strip_ssl_param(url: str) -> str:
        """Remove ?ssl=true or &ssl=true from a database URL."""
        lower = url.lower()
        idx = lower.find("?ssl=true")
        if idx != -1:
            return url[:idx] + url[idx + len("?ssl=true") :]
        idx = lower.find("&ssl=true")
        if idx != -1:
            return url[:idx] + url[idx + len("&ssl=true") :]
        return url

    # Whether the database connection should use SSL (detected from URL).
    database_ssl: bool = False

    db_pool_size: int = 10
    db_max_overflow: int = 20

    jwt_secret_key: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    max_upload_size: int = 52_428_800
    storage_type: Literal["local", "s3"] = "local"
    storage_path: str = "./storage"
    s3_bucket: str | None = None
    s3_endpoint_url: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_region: str | None = None

    login_max_attempts: int = 5
    login_lockout_seconds: int = 300
    api_rate_limit_per_minute: int = 120

    @field_validator("jwt_secret_key")
    @classmethod
    def secret_must_not_be_empty(cls, value: str) -> str:
        if not value or len(value) < 16:
            raise ValueError("JWT_SECRET_KEY must be at least 16 characters")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
