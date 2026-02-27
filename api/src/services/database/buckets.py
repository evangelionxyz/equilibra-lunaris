from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn
from services.database.database import _put_conn
from services.database.database import router as db_router

class DatabaseBucket(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    state: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    order_idx: Optional[int] = None
    is_deleted: Optional[bool] = False


@db_router.post("/projects/{project_id}/buckets")
def db_create_bucket(project_id: int, bucket: DatabaseBucket):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # fetch to the last idx
        mapping = {
            "project_id": project_id,
            "state": bucket.state,
            "created_at": bucket.created_at,
            "order_idx": 0,
            "is_deleted": False
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
        sql = f"INSERT INTO public.buckets ({cols_sql}) VALUES ({vals_sql}) RETURNING id, project_id, state, created_at, updated_at, order_idx, is_deleted;"

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
            "SELECT id, project_id, state, created_at, updated_at, order_idx, is_deleted FROM public.buckets WHERE project_id = %s;",
            (str(project_id),)
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
            "SELECT id, project_id, state, created_at, updated_at, order_idx, is_deleted FROM public.buckets WHERE id = %s AND project_id = %s LIMIT 1;",
            (str(bucket_id), str(project_id)),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


