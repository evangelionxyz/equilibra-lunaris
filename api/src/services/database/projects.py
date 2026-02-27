from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router

class DatabaseProject(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    tasks: Optional[list[int]] = None
    members: list[int] = Field(default_factory=list)
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@db_router.post("/projects")
def db_create_projects(project: DatabaseProject):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        mapping = {
            "name": project.name,
            "description": project.description,
            "tasks": project.tasks,
            "members": project.members,
            "is_deleted": project.is_deleted,
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
        sql = f"INSERT INTO public.projects ({cols_sql}) VALUES ({vals_sql}) RETURNING id, name, description, tasks, members, is_deleted, created_at, updated_at;"

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



@db_router.get("/projects")
def db_get_projects():
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, name, description, tasks, members, is_deleted, created_at, updated_at FROM public.projects;"
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/{project_id}")
def db_get_project_by_id(project_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, name, description, tasks, members, is_deleted, created_at, updated_at FROM public.projects WHERE id = %s LIMIT 1;",
            (project_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


