from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras

from services.database.database import _get_conn, _put_conn
from services.database.database import router as db_router
from services.database.id_generator import _generator
from services.telegram_service import send_telegram_message


class DatabaseAlert(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    context_id: Optional[int] = None
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
# CREATE /alerts
# ---------------------------------------------------------------------------
async def db_create_alert(alert_data: DatabaseAlert):
    """
    Creates an alert in the database and sends a Telegram notification if
    the user has a linked Chat ID.
    """
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Generate ID and prepare data
        alert_id = _generator.generate()
        
        # Suggested actions might be a list or None
        suggested_actions = alert_data.suggested_actions or []
        
        # If context_id is omitted, we might default it to project_id or something similar if the schema allows, 
        # but since it violated not-null, we must supply it.
        context_id = alert_data.context_id if alert_data.context_id else alert_data.project_id
        
        sql = """
            INSERT INTO public.alerts 
                (id, user_id, context_id, project_id, title, description, type, severity, suggested_actions, is_resolved) 
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE) 
            RETURNING id, user_id, context_id, project_id, title, description, type, severity, suggested_actions, is_resolved, created_at;
        """
        
        cur.execute(sql, (
            alert_id,
            str(alert_data.user_id), # We expect GitHub ID as per current convention
            context_id,
            alert_data.project_id,
            alert_data.title,
            alert_data.description,
            alert_data.type,
            alert_data.severity or "info",
            suggested_actions
        ))
        
        row = cur.fetchone()
        conn.commit()
        
        # 2. Telegram Notification (Fire and Forget or Async)
        try:
            # Query for the user's telegram_chat_id
            cur.execute("SELECT telegram_chat_id FROM public.users WHERE gh_id = %s LIMIT 1;", (str(alert_data.user_id),))
            user_row = cur.fetchone()
            
            if user_row and user_row.get("telegram_chat_id"):
                chat_id = user_row["telegram_chat_id"]
                msg = f"🔔 *{alert_data.title}*\n\n{alert_data.description}"
                await send_telegram_message(chat_id, msg)
        except Exception as tele_err:
            print(f"Failed to send Telegram notification: {tele_err}")
            
        return row
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


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
# GET /users/{user_id}/alerts  — Urgent Inbox Data Contract
# Returns only unresolved alerts. is_resolved is NEVER in the response.
# ---------------------------------------------------------------------------
@db_router.get("/users/{user_id}/alerts")
def db_get_alerts_for_user(user_id: str):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, type, context_id, created_at "
            "FROM public.alerts WHERE user_id = %s AND is_resolved = FALSE "
            "ORDER BY created_at DESC;",
            (user_id,)
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
