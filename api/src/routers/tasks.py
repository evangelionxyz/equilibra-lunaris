from typing import List, Literal, Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.database.database import _get_conn, _put_conn
from services.database.id_generator import _generator

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class TaskReviewItem(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    weight: int = Field(..., ge=1, le=8)
    type: Literal["CODE", "REQUIREMENT", "DESIGN", "OTHER"]
    assignee_id: Optional[int] = None


class BatchReviewPayload(BaseModel):
    alert_id: int
    project_id: int
    tasks: List[TaskReviewItem] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/batch-review", status_code=200)
def batch_review_tasks(payload: BatchReviewPayload):
    """
    Commit human-reviewed AI tasks to the database in a single transaction.

    Steps (all-or-nothing):
    1. Lock the ALERT row and reject if already resolved (409).
    2. Batch-insert tasks into public.tasks with bucket_id=1 and status='DRAFT'.
    3. Mark the alert as resolved.
    """
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ------------------------------------------------------------------
        # Step 1: Lock the alert row; guard against double-processing
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT is_resolved FROM public.alerts WHERE id = %s FOR UPDATE;",
            (payload.alert_id,),
        )
        alert_row = cur.fetchone()
        if alert_row is None:
            raise HTTPException(status_code=404, detail="Alert not found.")
        if alert_row["is_resolved"]:
            raise HTTPException(
                status_code=409,
                detail="Alert is already resolved. Tasks have already been committed.",
            )

        # ------------------------------------------------------------------
        # Step 1.5: Find the first bucket for the project
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT id FROM public.buckets WHERE project_id = %s ORDER BY order_idx ASC LIMIT 1;",
            (payload.project_id,)
        )
        bucket_row = cur.fetchone()
        if bucket_row is None:
            raise HTTPException(status_code=400, detail="Project has no buckets to insert tasks into.")

        target_bucket_id = bucket_row["id"]

        # ------------------------------------------------------------------
        # Step 1.6: Find the max order_idx for the target bucket
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT COALESCE(MAX(order_idx), -1) AS max_idx FROM public.tasks WHERE bucket_id = %s;",
            (target_bucket_id,)
        )
        max_idx_row = cur.fetchone()
        start_order_idx = max_idx_row["max_idx"] + 1

        # ------------------------------------------------------------------
        # Step 2: Batch-insert tasks (bucket_id=target_bucket_id, status=DRAFT)
        # ------------------------------------------------------------------
        insert_sql = """
            INSERT INTO public.tasks (
                id, project_id, bucket_id, lead_assignee_id,
                title, description, type, weight, status, order_idx
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        records = [
            (
                _generator.generate(),   # snowflake id
                payload.project_id,
                target_bucket_id,
                item.assignee_id,
                item.title,
                item.description,
                item.type,
                item.weight,
                "DRAFT",                  # forced: status
                start_order_idx + i,
            )
            for i, item in enumerate(payload.tasks)
        ]
        cur.executemany(insert_sql, records)

        # ------------------------------------------------------------------
        # Step 3: Resolve the alert
        # ------------------------------------------------------------------
        cur.execute(
            "UPDATE public.alerts SET is_resolved = TRUE WHERE id = %s;",
            (payload.alert_id,),
        )

        conn.commit()
        return {"status": "ok", "tasks_created": len(records)}

    except HTTPException:
        conn.rollback()
        raise
    except psycopg2.errors.ForeignKeyViolation as exc:
        # FK violation (e.g. invalid assignee_id) — transaction rolled back
        conn.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Foreign key constraint violation: {exc.diag.message_primary}",
        ) from exc
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
