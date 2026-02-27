from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router


class DatabaseUser(BaseModel):
    id: Optional[int] = None
    display_name: Optional[str] = None
    created_at: Optional[datetime] = None
    telegram_chat_id: str
    gh_username: str
    gh_access_token: Optional[str] = None
    gh_id: Optional[str] = None
    email: Optional[str] = None


@db_router.post("/users")
def db_create_user(user: DatabaseUser):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        mapping = {
            "display_name": user.display_name,
            "telegram_chat_id": user.telegram_chat_id,
            "gh_username": user.gh_username,
            "gh_access_token": user.gh_access_token,
            "gh_id": user.gh_id,
            "email": user.email,
        }

        columns = []
        placeholders = []
        params = []
        for k, v in mapping.items():
            if v is not None:
                columns.append(k)
                placeholders.append("%s")
                params.append(v)

        if not columns:
            raise HTTPException(status_code=400, detail="No data provided for insert")

        cols_sql = ", ".join(columns)
        vals_sql = ", ".join(placeholders)
        sql = f"INSERT INTO public.users ({cols_sql}) VALUES ({vals_sql}) RETURNING id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email;"

        cur.execute(sql, params)
        conn.commit()
        row = cur.fetchone()
        return row
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/users")
def db_get_users():
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email FROM public.users;"
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


def get_or_create_user(github_id: Optional[int] = None, email: Optional[str] = None, username: Optional[str] = None, display_name: Optional[str] = None, telegram_chat_id: Optional[str] = None, gh_access_token: Optional[str] = None):
    """
    Find a user by GitHub id or username. If not found, insert a new user using
    any provided fields and return the created row. Returns a dict-like row or None.
    """
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Check by GitHub ID (as string)
        if github_id is not None:
            cur.execute(
                "SELECT id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email FROM public.users WHERE gh_id = %s LIMIT 1;",
                (str(github_id),),
            )
            row = cur.fetchone()
            if row:
                return row

        # Check by username (ignore empty string)
        if username:
            cur.execute(
                "SELECT id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email FROM public.users WHERE gh_username = %s LIMIT 1;",
                (username,),
            )
            row = cur.fetchone()
            if row:
                return row

        # Check by email (ignore empty string)
        if email:
            cur.execute(
                "SELECT id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email FROM public.users WHERE email = %s LIMIT 1;",
                (email,),
            )
            row = cur.fetchone()
            if row:
                return row

        # Not found: insert using provided values
        # users.telegram_chat_id is NOT NULL in DB schema; GitHub login has no telegram id.
        # Use empty string as "not linked yet" placeholder so user creation can succeed.
        safe_telegram_chat_id = telegram_chat_id if telegram_chat_id is not None else ""

        mapping = {
            "display_name": display_name,
            "telegram_chat_id": safe_telegram_chat_id,
            "gh_username": username if username else None,
            "gh_access_token": gh_access_token,
            "gh_id": str(github_id) if github_id is not None else None,
            "email": email if email else None,
        }

        columns = []
        placeholders = []
        params = []
        for k, v in mapping.items():
            if v is not None:
                columns.append(k)
                placeholders.append("%s")
                params.append(v)

        if not columns:
            # nothing to insert
            raise HTTPException(status_code=400, detail="No data provided for insert")

        cols_sql = ", ".join(columns)
        vals_sql = ", ".join(placeholders)
        sql = f"INSERT INTO public.users ({cols_sql}) VALUES ({vals_sql}) RETURNING id, display_name, created_at, telegram_chat_id, gh_username, gh_access_token, gh_id, email;"

        cur.execute(sql, params)
        conn.commit()
        row = cur.fetchone()
        return row
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)