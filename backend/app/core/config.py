from functools import lru_cache
from typing import Literal

from pydantic import field_validator
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
    database_url_sync: str = "mysql+pymysql://chat:changeme@localhost:3306/private_chat"
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
