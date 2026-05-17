# Настройки приложения

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+psycopg://resumehelper:resumehelper_dev@postgres:5432/resumehelper"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_PUBLIC_ENDPOINT: str = ""
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "portfolio"
    MINIO_SECURE: bool = False

    IO_NET_API_KEY: str = ""
    IO_NET_BASE_URL: str = "https://api.intelligence.io.solutions/api/v1"
    IO_NET_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct"
    AI_MOCK_MODE: bool = True

    CORS_ORIGINS: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
