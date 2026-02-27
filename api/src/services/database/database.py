import hashlib
import socket
import tempfile
import psycopg2
import psycopg2.pool
from config import settings
from typing import Optional
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
_ssl_root_cert_path: Optional[str] = None


def _get_ssl_root_cert_path() -> Optional[str]:
    global _ssl_root_cert_path
    cert_pem = getattr(settings, "supabase_postgresql_cert", None)
    if not cert_pem:
        return None

    cert_text = cert_pem.strip()
    if not cert_text:
        return None

    if _ssl_root_cert_path and Path(_ssl_root_cert_path).exists():
        return _ssl_root_cert_path

    cert_hash = hashlib.sha256(cert_text.encode("utf-8")).hexdigest()[:16]
    cert_file = Path(tempfile.gettempdir()) / f"supabase_root_ca_{cert_hash}.pem"
    cert_file.write_text(cert_text + "\n", encoding="utf-8")
    _ssl_root_cert_path = str(cert_file)
    return _ssl_root_cert_path


def _host_has_ipv4(host: str) -> bool:
    try:
        infos = socket.getaddrinfo(host, None, family=socket.AF_INET, type=socket.SOCK_STREAM)
        return len(infos) > 0
    except OSError:
        return False


def _parse_pooler_endpoint(value: str) -> tuple[Optional[str], Optional[int], Optional[str], Optional[str], Optional[str]]:
    from urllib.parse import urlparse

    text = (value or "").strip()
    if not text:
        return None, None, None, None, None

    if "://" not in text:
        return text, None, None, None, None

    parsed = urlparse(text)
    return parsed.hostname, parsed.port, parsed.username, parsed.password, (parsed.path or "").lstrip("/") or None

def postgresql_dsn():
    from urllib.parse import quote_plus, urlparse, parse_qsl, urlencode, urlunparse
    ssl_root_cert = _get_ssl_root_cert_path()

    pooler_host_raw = getattr(settings, "postgresql_pooler_host", None)
    pooler_port_setting = getattr(settings, "postgresql_pooler_port", None)
    parsed_pooler_host, parsed_pooler_port, parsed_pooler_user, parsed_pooler_pwd, parsed_pooler_db = _parse_pooler_endpoint(pooler_host_raw or "")
    url = getattr(settings, "postgresql_database_url", None)
    if url:
        try:
            url_host = urlparse(url).hostname
        except Exception:
            url_host = None
        if (
            url_host
            and url_host.startswith("db.")
            and url_host.endswith(".supabase.co")
            and not _host_has_ipv4(url_host)
            and parsed_pooler_host
        ):
            url = None

    if url:
        try:
            parts = urlparse(url)
            q = dict(parse_qsl(parts.query))
            if "sslmode" not in q:
                q["sslmode"] = "require"
            if ssl_root_cert and "sslrootcert" not in q:
                q["sslrootcert"] = ssl_root_cert
            new_query = urlencode(q)
            parts = parts._replace(query=new_query)
            url = urlunparse(parts)
        except Exception:
            pass
        return url

    user = settings.postgresql_username
    pwd = settings.postgresql_password
    host = parsed_pooler_host or settings.postgresql_host
    port = parsed_pooler_port or pooler_port_setting or settings.postgresql_port or (6543 if parsed_pooler_host else 5432)
    db = parsed_pooler_db or settings.postgresql_database

    if parsed_pooler_user:
        user = parsed_pooler_user
    if parsed_pooler_pwd:
        pwd = parsed_pooler_pwd

    if not all([user, pwd, host, db]):
        raise RuntimeError("No Postgres configuration available: set POSTGRESQL_DATABASE_URL or the component vars (POSTGRESQL_USERNAME/POSTGRESQL_PASSWORD/POSTGRESQL_HOST/POSTGRESQL_DATABASE)")

    if host.startswith("db.") and host.endswith(".supabase.co") and not _host_has_ipv4(host):
        raise RuntimeError(
            "Supabase direct DB host resolves to IPv6 only on this network. "
            "Use the Supabase pooler connection instead by setting POSTGRESQL_DATABASE_URL, "
            "or set POSTGRESQL_POOLER_HOST/POSTGRESQL_POOLER_PORT (usually 6543)."
        )

    dsn = f"postgresql://{user}:{quote_plus(pwd)}@{host}:{port}/{db}"
    # append sslmode=require by default for hosted Postgres
    try:
        parts = urlparse(dsn)
        q = dict(parse_qsl(parts.query))
        if "sslmode" not in q:
            q["sslmode"] = "require"
        if ssl_root_cert and "sslrootcert" not in q:
            q["sslrootcert"] = ssl_root_cert
        new_query = urlencode(q)
        parts = parts._replace(query=new_query)
        dsn = urlunparse(parts)
    except Exception:
        pass

    return dsn


def create_pool(minconn: int = 1, maxconn: int = 10):
    """Create a threaded connection pool using the full Postgres URL from settings."""
    global _pool
    if _pool is None:

        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn,
            maxconn,
            dsn=postgresql_dsn(),
        )
    return _pool


def close_pool():
    """Close all pooled connections."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


def _get_conn():
    global _pool
    if _pool is None:
        create_pool()
    return _pool.getconn()


def _put_conn(conn):
    global _pool
    if _pool is not None:
        _pool.putconn(conn)
