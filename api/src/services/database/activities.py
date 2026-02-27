from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn, _put_conn
from services.database.database import router as db_router
from services.database.id_generator import _generator


class DatabaseActivity(BaseModel):
    id: Optional[int] = None
    project_id: int
    user_name: str
    action: str     # e.g. 'pushed', 'moved', 'generated'
    target: str     # e.g. 'auth-v2', 'Task A to QA'
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# POST /activities
# ---------------------------------------------------------------------------
@db_router.post("/activities")
def db_create_activity(activity: DatabaseActivity):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        mapping = {
            "id": _generator.generate(),
            "project_id": activity.project_id,
            "user_name": activity.user_name,
            "action": activity.action,
            "target": activity.target,
        }

        columns = [k for k, v in mapping.items() if v is not None]
        placeholders = ["%s"] * len(columns)
        params = [mapping[k] for k in columns]

        sql = (
            f"INSERT INTO public.activities ({', '.join(columns)}) "
            f"VALUES ({', '.join(placeholders)}) "
            f"RETURNING id, project_id, user_name, action, target, created_at;"
        )

        cur.execute(sql, params)
        conn.commit()
        return cur.fetchone()
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


# ---------------------------------------------------------------------------
# GET /projects/{project_id}/activities
# ---------------------------------------------------------------------------
@db_router.get("/projects/{project_id}/activities")
def db_get_activities_by_project(project_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, project_id, user_name, action, target, created_at "
            "FROM public.activities "
            "WHERE project_id = %s "
            "ORDER BY created_at DESC;",
            (project_id,),
        )
        return cur.fetchall()
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


# ---------------------------------------------------------------------------
# GET /activities/{activity_id}
# ---------------------------------------------------------------------------
@db_router.get("/activities/{activity_id}")
def db_get_activity_by_id(activity_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, project_id, user_name, action, target, created_at "
            "FROM public.activities WHERE id = %s LIMIT 1;",
            (activity_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Activity not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
