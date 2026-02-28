from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException
import psycopg2
import psycopg2.extras
import json

from services.database.database import _get_conn, _put_conn, SafeId
from services.database.database import router as db_router

class DatabaseMeeting(BaseModel):
    id: Optional[SafeId] = None
    project_id: Optional[SafeId] = None
    user_uuid: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    source_type: Optional[str] = None
    mom_summary: Optional[str] = None
    key_decisions: Optional[List[str]] = None
    action_items: Optional[List[dict]] = None
    created_at: Optional[datetime] = None


@db_router.post("/db-meetings")
def db_create_meeting(meeting: DatabaseMeeting):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        data = meeting.model_dump(exclude_unset=True, exclude_none=True)

        if "key_decisions" in data and data["key_decisions"] is not None:
            data["key_decisions"] = json.dumps(data["key_decisions"])
        if "action_items" in data and data["action_items"] is not None:
            data["action_items"] = json.dumps(data["action_items"])
            
        if "id" not in data or data["id"] is None:
             from services.database.id_generator import _generator
             data["id"] = _generator.generate()

        columns = list(data.keys())
        values = list(data.values())

        if not columns:
            raise HTTPException(status_code=400, detail="No data provided")

        cols = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        sql = f"""
            INSERT INTO public.meetings ({cols}) 
            VALUES ({placeholders}) 
            RETURNING id, project_id, user_uuid, title, date, time, duration, source_type, mom_summary, key_decisions, action_items, created_at;
        """

        cur.execute(sql, values)
        conn.commit()
        row = cur.fetchone()
        
        # Convert JSON strings back to python structures
        if row:
             if isinstance(row.get("key_decisions"), str):
                 row["key_decisions"] = json.loads(row["key_decisions"])
             if isinstance(row.get("action_items"), str):
                 row["action_items"] = json.loads(row["action_items"])
             
        return row

    except psycopg2.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=422, detail=f"Database integrity error: {str(e)}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


@db_router.get("/db-meetings/project/{project_id}")
def db_get_meetings_by_project(project_id: SafeId):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # mom_summary and key_decisions are LAZY LOAD — omitted here intentionally.
        # Fetch them individually via GET /db-meetings/{id}.
        sql = """
            SELECT id, project_id, user_uuid, title, date, time, duration, source_type, action_items, created_at
            FROM public.meetings 
            WHERE project_id = %s
            ORDER BY created_at DESC;
        """
        cur.execute(sql, (project_id,))
        rows = cur.fetchall()
        
        for row in rows:
             if isinstance(row.get("action_items"), str):
                 row["action_items"] = json.loads(row["action_items"])
                 
        return rows
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
