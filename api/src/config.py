from pathlib import Path
from typing import Annotated, Optional

from pydantic import AliasChoices
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

_REPO_ROOT = Path(__file__).parent.parent.parent


def _nullable_int(v: object) -> int | None:
    """Coerce empty strings and NULL-like values to None for optional int fields."""
    if v is None or str(v).strip().upper() in ("", "NULL", "NONE"):
        return None
    return v


class Settings(BaseSettings):
    supabase_url: str = Field(validation_alias=AliasChoices("SUPABASE_URL"))
    supabase_key: str = Field(validation_alias=AliasChoices("SUPABASE_KEY"))
    postgresql_database_url: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_DATABASE_URL"))
    postgresql_username: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_USERNAME"))
    postgresql_password: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_PASSWORD"))
    postgresql_host: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_HOST"))
    postgresql_port: Optional[int] = Field(None, validation_alias=AliasChoices("POSTGRESQL_PORT"))
    postgresql_pooler_host: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_POOLER_HOST", "SUPABASE_POOLER_HOST"))
    postgresql_pooler_port: Optional[int] = Field(None, validation_alias=AliasChoices("POSTGRESQL_POOLER_PORT", "SUPABASE_POOLER_PORT"))
    postgresql_database: Optional[str] = Field(None, validation_alias=AliasChoices("POSTGRESQL_DATABASE"))
    supabase_postgresql_cert: Optional[str] = Field(None, validation_alias=AliasChoices("SUPABASE_POSTGRESQL_CERT"))
    gh_app_id: int = Field(validation_alias=AliasChoices("GH_APP_ID"))
    gh_app_private_key: str = Field(validation_alias=AliasChoices("GH_APP_PRIVATE_KEY"))
    gh_webhook_secret: str = Field(validation_alias=AliasChoices("GH_WEBHOOK_SECRET"))
    gh_app_client_id: str = Field(validation_alias=AliasChoices("GH_APP_CLIENT_ID"))
    gh_app_client_secret: str = Field(validation_alias=AliasChoices("GH_APP_CLIENT_SECRET"))
    gh_app_installation_id: Annotated[int | None, BeforeValidator(_nullable_int)] = None
    gh_oauth_redirect_uri: str = Field(
        default="http://127.0.0.1:8000/auth/callback",
        validation_alias=AliasChoices("GH_OAUTH_REDIRECT_URI"),
    )
    frontend_url: str = Field(default="http://127.0.0.1:5173", validation_alias=AliasChoices("FRONTEND_URL"))
    gemini_api_key: str = Field(validation_alias=AliasChoices("GEMINI_API_KEY"))

    secret_key: str
    recall_api_key: str | None = None
    telegram_bot_token: Optional[str] = Field(None, validation_alias=AliasChoices("TELEGRAM_BOT_TOKEN"))

    # PostgreSQL
    postgresql_host: str = "localhost"
    postgresql_port: int = 5432
    postgresql_username: str = "postgres"
    postgresql_password: Annotated[
        str,
        AliasChoices("POSTGRESQL_PASSWORD", "POSTGRESQL_PASSWPRD"),
    ] = ""
    postgresql_database: str = "postgres"

    _env_file = _REPO_ROOT / ".env.local"
    model_config = SettingsConfigDict(
        env_file=str(_env_file) if _env_file.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()