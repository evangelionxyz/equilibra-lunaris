from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException, Depends
from routers.auth import get_current_user
from services.database.users import get_or_create_user
import psycopg2
import psycopg2.extras
import logging

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router, SafeId
from services.database.id_generator import _generator

logger = logging.getLogger(__name__)

class DatabaseProjectMember(BaseModel):
    id: Optional[SafeId] = None
    user_id: Optional[SafeId] = None
    project_id: Optional[SafeId] = None
    role: Optional[str] = None
    kpi_score: Optional[float] = None
    max_capacity: Optional[int] = None
    current_load: Optional[int] = None
    gh_username: Optional[str] = None


@db_router.post("/projects/{project_id}/members")
def db_create_member(project_id: SafeId, member: DatabaseProjectMember):
    conn = _get_conn()
    cur = None
    try:
        logger.info("db_create_member called for project_id=%s user_id=%s", project_id, member.user_id)
        print(f"[DEBUG] db_create_member called - project_id={project_id} user_id={member.user_id}")
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        mapping = {
            "id": _generator.generate(),
            "user_id": member.user_id,
            "project_id": project_id,
            "role": member.role,
            "kpi_score": member.kpi_score,
            "max_capacity": member.max_capacity,
            "current_load": member.current_load,
            "gh_username": member.gh_username,
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
        sql = f"INSERT INTO public.project_member ({cols_sql}) VALUES ({vals_sql}) RETURNING id, user_id, project_id, role, kpi_score, max_capacity, current_load, gh_username;"

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


@db_router.get("/users/me/project_members")
def db_get_my_project_members(current_user: dict = Depends(get_current_user)):
    conn = _get_conn()
    cur = None
    try:
        db_user = get_or_create_user(int(current_user.get("id", 0) or 0), current_user.get("email"), current_user.get("login"), current_user.get("name"))
        if not db_user:
            raise HTTPException(status_code=404, detail="DB user not found")
            
        db_user_id = db_user.get("id")

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            SELECT pm.id, pm.user_id, pm.project_id, pm.role, pm.kpi_score, pm.max_capacity, pm.current_load, u.gh_username
            FROM public.project_member pm
            LEFT JOIN public.users u ON pm.user_id = u.id
            WHERE pm.user_id = %s
            """,
            (db_user_id,)
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/{project_id}/members")
def db_get_members(project_id: SafeId):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            SELECT pm.id, pm.user_id, pm.project_id, pm.role, pm.kpi_score, pm.max_capacity, pm.current_load, u.gh_username
            FROM public.project_member pm
            LEFT JOIN public.users u ON pm.user_id = u.id
            WHERE pm.project_id = %s
            """,
            (project_id,)
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/{project_id}/members/{member_id}")
def db_get_member_by_id(project_id: SafeId, member_id: SafeId):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            SELECT pm.id, pm.user_id, pm.project_id, pm.role, pm.kpi_score, pm.max_capacity, pm.current_load, u.gh_username
            FROM public.project_member pm
            LEFT JOIN public.users u ON pm.user_id = u.id
            WHERE pm.project_id = %s AND pm.user_id = %s LIMIT 1;
            """,
            (project_id, member_id),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project member not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


