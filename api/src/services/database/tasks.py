from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router
from services.database.id_generator import _generator

class DatabaseTask(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    bucket_id: Optional[int] = None
    meeting_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    lead_assignee_id: Optional[int] = None
    suggested_assignee_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    type: str  # CODE, REQUIREMENT, DESIGN, OTHER
    weight: int  # Points (1-8)
    branch_name: Optional[str] = None
    last_activity_at: Optional[datetime] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@db_router.post("/tasks")
def db_create_task(task: DatabaseTask):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # fetch to the last idx
        mapping = {
            "id": _generator.generate(),    
            "project_id": task.project_id,
            "bucket_id": task.bucket_id,
            "meeting_id": task.meeting_id,
            "parent_task_id": task.parent_task_id,
            "lead_assignee_id": task.lead_assignee_id,
            "suggested_assignee_id": task.suggested_assignee_id,
            "title": task.title,
            "description": task.description,
            "type": task.type,
            "weight": task.weight,
            "branch_name": task.branch_name,
            "last_activity_at": task.last_activity_at,
            "is_deleted": task.is_deleted,
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
        sql = f"INSERT INTO public.tasks ({cols_sql}) VALUES ({vals_sql}) RETURNING id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, is_deleted, created_at, updated_at;"

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



@db_router.get("/tasks")
def db_get_tasks():
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM public.tasks;")
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/tasks/{task_id}")
def db_get_task_by_id(task_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, is_deleted, created_at, updated_at FROM public.tasks WHERE id = %s LIMIT 1;",
            (task_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.put("/tasks/{task_id}")
def db_update_task(task_id: int, task_data: DatabaseTask):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        update_data = task_data.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
        params = list(update_data.values())
        params.append(task_id)
        
        sql = f"UPDATE public.tasks SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, is_deleted, created_at, updated_at;"
        
        cur.execute(sql, params)
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.delete("/tasks/{task_id}")
def db_delete_task(task_id: int):
    """Soft delete a task."""
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        sql = "UPDATE public.tasks SET is_deleted = True, updated_at = NOW() WHERE id = %s RETURNING id;"
        cur.execute(sql, (task_id,))
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"id": task_id, "status": "deleted"}
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


