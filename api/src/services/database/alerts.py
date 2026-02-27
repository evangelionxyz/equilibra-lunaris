from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn, _put_conn
from services.database.database import router as db_router
from services.database.id_generator import _generator


class DatabaseAlert(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None          # STAGNATION | REALLOCATION | DRAFT_APPROVAL
    severity: Optional[str] = None     # critical | warning | info
    suggested_actions: Optional[List[str]] = None
    is_resolved: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# GET /alerts
# ---------------------------------------------------------------------------
@db_router.get("/alerts")
def db_get_alerts():
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, user_id, project_id, title, description, type, severity, "
            "suggested_actions, is_resolved, created_at, updated_at "
            "FROM public.alerts ORDER BY created_at DESC;"
        )
        rows = cur.fetchall()
        return rows
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


# ---------------------------------------------------------------------------
# GET /alerts/{alert_id}
# ---------------------------------------------------------------------------
@db_router.get("/alerts/{alert_id}")
def db_get_alert_by_id(alert_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, user_id, project_id, title, description, type, severity, "
            "suggested_actions, is_resolved, created_at, updated_at "
            "FROM public.alerts WHERE id = %s LIMIT 1;",
            (alert_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Alert not found")
        return row
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


# ---------------------------------------------------------------------------
# PUT /alerts/{alert_id}
# ---------------------------------------------------------------------------
@db_router.put("/alerts/{alert_id}")
def db_update_alert(alert_id: int, alert_data: DatabaseAlert):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        update_data = alert_data.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")

        set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
        params = list(update_data.values())
        params.append(alert_id)

        sql = (
            f"UPDATE public.alerts SET {set_clause}, updated_at = NOW() "
            f"WHERE id = %s "
            f"RETURNING id, user_id, project_id, title, description, type, severity, "
            f"suggested_actions, is_resolved, created_at, updated_at;"
        )

        cur.execute(sql, params)
        conn.commit()
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Alert not found")
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
