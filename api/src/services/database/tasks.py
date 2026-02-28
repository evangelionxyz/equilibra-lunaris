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
    order_idx: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@db_router.post("/tasks")
def db_create_task(task: DatabaseTask):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Generate new order_idx if missing
        assigned_order_idx = task.order_idx
        if assigned_order_idx is None and task.bucket_id is not None:
            cur.execute("SELECT COALESCE(MAX(order_idx), -1) + 1 AS next_idx FROM public.tasks WHERE bucket_id = %s;", (task.bucket_id,))
            row = cur.fetchone()
            assigned_order_idx = row['next_idx'] if row else 0

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
            "order_idx": assigned_order_idx,
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
        sql = f"INSERT INTO public.tasks ({cols_sql}) VALUES ({vals_sql}) RETURNING id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, order_idx, created_at, updated_at;"

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
        cur.execute("SELECT id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, order_idx, created_at, updated_at FROM public.tasks;")
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
            "SELECT id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, order_idx, created_at, updated_at FROM public.tasks WHERE id = %s LIMIT 1;",
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
        
        sql = f"UPDATE public.tasks SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING id, project_id, bucket_id, meeting_id, parent_task_id, lead_assignee_id, suggested_assignee_id, title, description, type, weight, branch_name, last_activity_at, order_idx, created_at, updated_at;"
        
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
    """Hard delete a task."""
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("DELETE FROM public.tasks WHERE id = %s RETURNING id;", (task_id,))
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"id": task_id, "status": "deleted"}
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


@db_router.put("/projects/{project_id}/buckets/{bucket_id}/tasks/reorder")
def db_reorder_tasks(project_id: int, bucket_id: int, task_ids: list[int]):
    """Batch reorder tasks inside a specific bucket."""
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Verify tasks belong to the project
        if not task_ids:
            return {"status": "success", "order": [], "bucket_id": bucket_id}

        format_strings = ','.join(['%s'] * len(task_ids))
        cur.execute(
            f"SELECT id FROM public.tasks WHERE project_id = %s AND id IN ({format_strings});",
            tuple([project_id] + task_ids)
        )
        valid_tasks = set(row['id'] for row in cur.fetchall())
        invalid_tasks = set(task_ids) - valid_tasks
        if invalid_tasks:
            raise HTTPException(status_code=400, detail=f"Invalid task IDs for this project: {invalid_tasks}")
            
        # Step 1: Push out of the valid constraint range to avoid conflicts
        for idx, t_id in enumerate(task_ids):
            cur.execute(
                "UPDATE public.tasks SET order_idx = %s, bucket_id = %s WHERE id = %s AND project_id = %s;",
                (-(idx + 1000), bucket_id, t_id, project_id)
            )

        # Step 2: Set absolute new order_idx within the same bucket
        for idx, t_id in enumerate(task_ids):
            cur.execute(
                "UPDATE public.tasks SET order_idx = %s, updated_at = NOW() WHERE id = %s AND project_id = %s;",
                (idx, t_id, project_id)
            )

        conn.commit()
        return {"status": "success", "order": task_ids, "bucket_id": bucket_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
