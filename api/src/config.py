from pathlib import Path
from typing import Annotated

from pydantic import AliasChoices
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).parent.parent.parent


def _nullable_int(v: object) -> int | None:
    """Coerce empty strings and NULL-like values to None for optional int fields."""
    if v is None or str(v).strip().upper() in ("", "NULL", "NONE"):
        return None
    return v


from pydantic import Field

class Settings(BaseSettings):
    gh_app_id: int = Field(validation_alias=AliasChoices("GH_APP_ID", "GITHUB_APP_ID"))
    gh_app_private_key: str = Field(validation_alias=AliasChoices("GH_APP_PRIVATE_KEY", "GITHUB_APP_PRIVATE_KEY"))
    gh_webhook_secret: str = Field(validation_alias=AliasChoices("GH_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET"))
    gh_app_client_id: str = ""
    gh_app_client_secret: str = ""
    gh_app_installation_id: Annotated[int | None, BeforeValidator(_nullable_int)] = None
    gh_oauth_redirect_uri: str = "http://127.0.0.1:8000/auth/callback"
    gemini_api_key: str
    frontend_url: str = "http://127.0.0.1:5173"

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

    @property
    def postgresql_dsn(self) -> str:
        return (
            f"postgresql://{self.postgresql_username}:{self.postgresql_password}"
            f"@{self.postgresql_host}:{self.postgresql_port}/{self.postgresql_database}"
        )


settings = Settings()