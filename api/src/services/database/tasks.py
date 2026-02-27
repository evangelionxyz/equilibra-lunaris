from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router

class DatabaseTask(BaseModel):
    id: Optional[int] = None
    bucket_id: Optional[int] = None
    parent_task: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    assign_ids: Optional[list[int]] = None
    is_completed: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    project_id: Optional[int] = None
    order_idx: Optional[int] = None
    is_deleted: Optional[bool] = False


@db_router.post("/tasks")
def db_create_task(task: DatabaseTask):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # fetch to the last idx
        mapping = {
            "project_id": task.project_id,
            "bucket_id": task.bucket_id,
            "parent_task_id": task.parent_task,
            "title": task.title,
            "description": task.description,
            "assign_ids": task.assign_ids,
            "order_idx": task.order_idx if task.order_idx is not None else 0,
            "is_completed": task.is_completed if task.is_completed is not None else False,
            "is_deleted": task.is_deleted if task.is_deleted is not None else False,
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
        sql = f"INSERT INTO public.tasks ({cols_sql}) VALUES ({vals_sql}) RETURNING id, bucket_id, parent_task, title, description, assign_ids, is_completed, created_at, updated_at, project_id, order_idx, is_deleted;"

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
            "SELECT id, bucket_id, parent_task_id, title, description, assign_ids, is_completed, created_at, updated_at, project_id, order_idx, is_deleted FROM public.tasks WHERE id = %s LIMIT 1;",
            (task_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


