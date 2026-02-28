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

class DatabaseBucket(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    state: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    order_idx: Optional[int] = None


@db_router.post("/buckets")
def db_create_bucket(item: DatabaseBucket):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Compute next order_idx (based on active buckets)
        if item.order_idx is None:
            cur.execute(
                "SELECT COALESCE(MAX(order_idx), -1) as max_idx FROM public.buckets WHERE project_id = %s",
                (item.project_id,)
            )
            result = cur.fetchone()
            item.order_idx = result["max_idx"] + 1

        mapping = {
            "id": _generator.generate(),
            "project_id": item.project_id,
            "state": item.state,
            "created_at": item.created_at,
            "order_idx": item.order_idx,
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
        sql = f"INSERT INTO public.buckets ({cols_sql}) VALUES ({vals_sql}) RETURNING id, project_id, state, created_at, updated_at, order_idx;"

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



@db_router.get("/projects/{project_id}/buckets")
def db_get_buckets(project_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, project_id, state, created_at, updated_at, order_idx FROM public.buckets WHERE project_id = %s;",
            (project_id,)
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/projects/{project_id}/buckets/{bucket_id}")
def db_get_bucket_by_id(project_id: int, bucket_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, project_id, state, created_at, updated_at, order_idx FROM public.buckets WHERE id = %s AND project_id = %s LIMIT 1;",
            (bucket_id, project_id),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Bucket not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.put("/projects/{project_id}/buckets/reorder")
def db_reorder_buckets(project_id: int, bucket_ids: list[int]):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Step 1: Set order_idx to negative equivalents to avoid unique constraint violations during swap
        for idx, b_id in enumerate(bucket_ids):
            cur.execute(
                "UPDATE public.buckets SET order_idx = %s WHERE id = %s AND project_id = %s;",
                (-(idx + 1000), b_id, project_id)
            )
            
        # Step 2: Set absolute new order_idx
        for idx, b_id in enumerate(bucket_ids):
            cur.execute(
                "UPDATE public.buckets SET order_idx = %s, updated_at = NOW() WHERE id = %s AND project_id = %s;",
                (idx, b_id, project_id)
            )

        conn.commit()
        return {"status": "success", "order": bucket_ids}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.delete("/projects/{project_id}/buckets/{bucket_id}")
def db_delete_bucket(project_id: int, bucket_id: int):
    """Hard delete a bucket. Refuses if the bucket still has tasks."""
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Check if tasks are in the bucket
        cur.execute("SELECT COUNT(*) as count FROM public.tasks WHERE bucket_id = %s;", (bucket_id,))
        count = cur.fetchone()['count']
        if count > 0:
             raise HTTPException(status_code=400, detail="Cannot delete bucket with active tasks. Please move or delete tasks first.")

        cur.execute("DELETE FROM public.buckets WHERE id = %s AND project_id = %s RETURNING id;", (bucket_id, project_id))
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Bucket not found")
        return {"id": bucket_id, "status": "deleted"}
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
