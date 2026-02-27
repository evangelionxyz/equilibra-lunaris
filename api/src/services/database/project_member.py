from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router

class DatabaseProjectMember(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    project_id: Optional[str] = None
    role: Optional[str] = None
    kpi_score: Optional[float] = None
    max_capacity: int = None
    current_load: int = None


@db_router.post("/projects/{project_id}/members")
def db_create_member(project_id: int, member: DatabaseProjectMember):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        mapping = {
            "user_id": member.user_id,
            "project_id": project_id,
            "role": member.role,
            "kpi_score": member.kpi_score,
            "max_capacity": member.max_capacity,
            "current_load": member.current_load
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
        sql = f"INSERT INTO public.projects ({cols_sql}) VALUES ({vals_sql}) RETURNING id, user_id, project_id, role, kpi_score, max_capacity, current_load;"

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



@db_router.get("/projects/{project_id}/members")
def db_get_members(project_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, user_id, project_id, role, kpi_score, max_capacity, current_load FROM public.project_member WHERE project_id = %s",
            (str(project_id))
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/{project_id}/members/{member_id}")
def db_get_member_by_id(project_id: int, member_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, user_id, project_id, role, kpi_score, max_capacity, current_load FROM public.project_member WHERE project_id AND user_id = %s LIMIT 1;",
            (str(project_id), str(member_id)),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project member not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


