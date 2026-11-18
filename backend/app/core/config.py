from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da API carregadas do ambiente."""

    app_name: str = "TrampoCerto API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "mysql+pymysql://trampocerto:trampocerto@localhost:3306/trampocerto"
    jwt_secret_key: SecretStr = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    cors_origins: str = "http://localhost:5173"
    upload_directory: str = "uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024
    login_rate_limit: str = "5/minute"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
