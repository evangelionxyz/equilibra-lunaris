from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException, Depends
from routers.auth import get_current_user_optional
from routers.auth import get_current_user
from services.database.users import get_or_create_user
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router
from services.database.id_generator import _generator

class DatabaseProject(BaseModel):
    id: Optional[int] = None
    name: str
    gh_repo_url: Optional[list[str]] = Field(default_factory=list)
    description: Optional[str] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@db_router.post("/projects")
def db_create_project(project: DatabaseProject, current_user: dict | None = Depends(get_current_user_optional)):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        mapping = {
            "id": _generator.generate(),
            "name": project.name,
            "gh_repo_url": project.gh_repo_url,
            "description": project.description,
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
        sql = f"INSERT INTO public.projects ({cols_sql}) VALUES ({vals_sql}) RETURNING id, name, gh_repo_url, description, is_deleted, created_at, updated_at;"

        cur.execute(sql, params)
        row = cur.fetchone()
        if row is None:
            conn.rollback()
            raise HTTPException(status_code=500, detail="Failed to create project")
        conn.commit()
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
            "SELECT id, name, gh_repo_url, description, is_deleted, created_at, updated_at FROM public.projects;"
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/mine")
def db_get_projects_for_current_user(current_user: dict = Depends(get_current_user)):
    """Return projects where the current user is a member (based on project_member.user_id).
    Ensures a DB user record exists for the GitHub user via `get_or_create_user` and then
    looks up project_member rows to find project ids and returns those projects.
    """
    conn = _get_conn()
    cur = None
    try:
        db_user = get_or_create_user(int(current_user.get("id", 0) or 0), current_user.get("email"), current_user.get("login"), current_user.get("name"))
        if not db_user:
            raise HTTPException(status_code=404, detail="DB user not found")

        db_user_id = db_user.get("id")

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT project_id FROM public.project_member WHERE user_id = %s",
            (db_user_id,)
        )
        rows = cur.fetchall()
        project_ids = [r.get("project_id") for r in rows]

        if not project_ids:
            return []

        cur.execute(
            "SELECT id, name, gh_repo_url, description, is_deleted, created_at, updated_at FROM public.projects WHERE id = ANY(%s);",
            (project_ids,)
        )
        projects = cur.fetchall()
        return projects
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
            "SELECT id, name, gh_repo_url, description, is_deleted, created_at, updated_at FROM public.projects WHERE id = %s LIMIT 1;",
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


@db_router.put("/projects/{project_id}")
def db_update_project(project_id: int, project_data: DatabaseProject):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        update_data = project_data.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
        params = list(update_data.values())
        params.append(project_id)
        
        sql = f"UPDATE public.projects SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING id, name, gh_repo_url, description, is_deleted, created_at, updated_at;"
        
        cur.execute(sql, params)
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.delete("/projects/{project_id}")
def db_delete_project(project_id: int):
    """Soft delete a project."""
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "UPDATE public.projects SET is_deleted = True, updated_at = NOW() WHERE id = %s RETURNING id;"
        cur.execute(sql, (project_id,))
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"id": project_id, "status": "deleted"}
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


