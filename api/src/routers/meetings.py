import asyncio
import json
import secrets
import re
from typing import List, Optional
import fastapi
from fastapi import APIRouter, HTTPException, UploadFile, File, Request, BackgroundTasks, Depends
import httpx
import psycopg2
import psycopg2.extras
from pydantic import BaseModel
from google import genai
from google.genai import types

from config import settings
from routers.auth import get_current_user
from services.database.database import _get_conn, _put_conn
from services.database.id_generator import _generator

from services.database.alerts import DatabaseAlert, db_create_alert

router = APIRouter(tags=["Meetings"])

async def _create_draft_approval_alert(user_uuid: str, project_id: int, meeting_title: str) -> int:
    """Create a DRAFT_APPROVAL alert in the DB and return its new ID."""
    try:
        title = f"Review Extracted Tasks: {meeting_title}"
        desc = "The AI has finished extracting tasks from the meeting. Please review and confirm which ones should be added to the backlog."
        
        alert_data = DatabaseAlert(
            user_id=int(user_uuid) if user_uuid.isdigit() else None, # Assuming user_uuid is GH ID string
            project_id=project_id,
            title=title,
            description=desc,
            type="DRAFT_APPROVAL",
            severity="info"
        )
        
        # Override user_id logic if needed, but db_create_alert handles coercion to string
        alert_data.user_id = user_uuid 
        
        row = await db_create_alert(alert_data)
        return row["id"] if row else -1
    except Exception as e:
        print(f"Failed to create alert: {e}")
        return -1

TEMP_ANALYSIS_RESULTS = {}  # Temporary in-memory storage for results


# ==========================================
# MODELS
# ==========================================
class ExtractedTaskPayload(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = "OTHER"
    weight: Optional[int] = 3
    project_id: int
    bucket_id: int


class ConfirmTasksRequest(BaseModel):
    alert_id: int
    tasks: List[ExtractedTaskPayload]

from services.database.meetings import DatabaseMeeting, db_create_meeting, db_get_meetings_by_project

# ==========================================
# FUNGSI DATABASE SUPABASE (DEPRECATED -> PostgreSQL)
# ==========================================
async def list_meetings_for_project(project_id: int):
    try:
        results = db_get_meetings_by_project(project_id)
        return results
    except Exception as e:
        print(f"Error mengambil data dari Postgres: {e}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data dari database.")

async def create_meeting_record(meeting: dict):
    try:
        # Convert dictionary to DatabaseMeeting Pydantic model
        db_meeting = DatabaseMeeting(**meeting)
        result = db_create_meeting(db_meeting)
        return result
    except Exception as e:
        print(f"Error menyimpan ke Postgres: {e}")
        raise Exception(f"Gagal menyimpan ke Postgres: {e}")

# ==========================================
# KONFIGURASI AI
# ==========================================
MODEL_ID = "gemini-2.5-flash"
client = genai.Client(api_key=settings.gemini_api_key)

GEMINI_SYSTEM_PROMPT = """
Role: Expert Project Manager dan AI Transcriber.
Task: Analisis data meeting untuk membuat Minutes of Meeting (MOM) dan Action Items (Task).
Output: WAJIB JSON valid tanpa teks tambahan.
Language: Bahasa Inggris.

Schema JSON:
{
  "mom": {
    "judul_meeting": "string",
    "ringkasan_eksekutif": "string",
    "poin_diskusi": ["string"],
    "keputusan_final": ["string"]
  },
  "action_items": [
    {
      "task": "string",
      "pic": "string",
      "priority": "high/medium/low",
      "due_date": "YYYY-MM-DD atau 'TBD'",
      "reason": "string"
    }
  ]
}
IMPORTANT: Ensure the JSON is valid and all fields match the schema. Do not include markdown code blocks in the output.
"""

FALLBACK_DATA = {
  "mom": {
    "judul_meeting": "Sinkronisasi Pengembangan Aplikasi",
    "ringkasan_eksekutif": "Meeting koordinasi lintas departemen (Data Fallback).",
    "poin_diskusi": ["Poin 1", "Poin 2"],
    "keputusan_final": ["Keputusan 1"]
  },
  "action_items": [
    {
      "task": "Task Fallback 1",
      "pic": "Budi",
      "priority": "high",
      "due_date": "2026-03-07",
      "reason": "Alasan 1"
    }
  ]
}

# ==========================================
# HELPER FUNCTIONS
# ==========================================
def _build_proposed_tasks(action_items: list[dict] | None) -> list[dict]:
    items = action_items or []
    proposed_tasks: list[dict] = []
    for item in items:
        proposed_tasks.append({
            "title": item.get("task", "Untitled Task"),
            "description": item.get("description", ""),
            "reason": item.get("reason", ""),
            "due_date": item.get("due_date"),
            "priority": item.get("priority", "medium"),
            "assignee_username": item.get("pic")
        })
    return proposed_tasks

def _extract_json_object(raw_text: str) -> dict:
    cleaned_text = raw_text.strip()
    # Remove markdown code fences if present
    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned_text, re.DOTALL)
    if fenced_match:
        cleaned_text = fenced_match.group(1).strip()
    
    # Try direct parse
    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        # Try to find the first { and last }
        start = cleaned_text.find("{")
        end = cleaned_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            inner_text = cleaned_text[start:end + 1]
            try:
                return json.loads(inner_text)
            except json.JSONDecodeError as e:
                # If it's still failing, try common fixes for Gemini output
                # 1. Missing commas before new fields "field": -> ,"field":
                repaired = re.sub(r'([^\s,\[\{\:])\s*\n\s*\"', r'\1,\n"', inner_text)
                # 2. Trailing commas before closing braces/brackets
                repaired = re.sub(r',\s*([\}\]])', r'\1', repaired)
                try:
                    return json.loads(repaired)
                except:
                    print(f"Failed to repair JSON. Original error: {e}")
                    raise e
        raise

async def _parse_gemini_response(response: object) -> dict:
    # Use standard text extraction from response
    try:
        response_text = response.text
    except Exception:
        try:
             response_text = response.candidates[0].content.parts[0].text
        except:
             raise ValueError("Gagal mengekstrak teks dari respon Gemini")
    
    if not response_text:
        raise ValueError("Respon Gemini kosong")
        
    return _extract_json_object(response_text)

def _fallback_analysis_payload(reason: str) -> dict:
    proposed_tasks = _build_proposed_tasks(FALLBACK_DATA.get("action_items", []))
    return {
        "status": f"fallback ({reason})",
        "meeting_id": "fallback-" + secrets.token_hex(4),
        "proposed_tasks": proposed_tasks,
        "data": FALLBACK_DATA
    }

# ==========================================
# ENDPOINTS (DENGAN LOGIN GITHUB & SUPABASE)
# ==========================================
@router.get("/meetings/project/{project_id}")
async def get_meetings(project_id: int, current_user: dict = Depends(get_current_user)):
    return await list_meetings_for_project(project_id)

class MeetingSyncRequest(BaseModel):
    project_id: int
    title: str
    date: str
    time: str
    duration: str
    source_type: str
    mom_summary: str
    key_decisions: List[str]
    action_items: List[dict]

@router.post("/meetings")
async def create_meeting(request: MeetingSyncRequest, current_user: dict = Depends(get_current_user)):
    try:
        meeting_data = request.model_dump()
        meeting_data["user_uuid"] = str(current_user.get("id"))
        return await create_meeting_record(meeting_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-meeting", tags=["AI"])
async def analyze_meeting_endpoint(
    project_id: int = fastapi.Form(...),
    file: UploadFile = File(...),
    current_user: dict = fastapi.Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith(("audio/", "video/")):
        raise HTTPException(status_code=400, detail="File harus berupa audio atau video.")
    
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id form field is required.")

    try:
        input_bytes = await file.read()
        mime_type = file.content_type

        try:
            # For audio/video, it's safer to use the File API if file is large, 
            # but for now let's at least switch to async call
            response = await client.aio.models.generate_content(
                model=MODEL_ID,
                contents=[
                    GEMINI_SYSTEM_PROMPT,
                    types.Part.from_bytes(data=input_bytes, mime_type=mime_type)
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
        except Exception as exc:
            print(f"Gemini request failed: {exc}")
            # If it's a connection error, it might be due to size.
            return _fallback_analysis_payload(f"api-error: {str(exc)[:50]}")

        try:
            analysis_result = await _parse_gemini_response(response)
        except Exception as exc:
            print(f"Gemini JSON parse failed: {exc}")
            return _fallback_analysis_payload("invalid-json")

        mom_data = analysis_result.get("mom", {})
        title = mom_data.get("judul_meeting") or "Meeting Tanpa Judul"
        proposed_tasks = _build_proposed_tasks(analysis_result.get("action_items", []))
        
        from datetime import datetime
        # 1. Automate persistence: Save to DB immediately
        meeting_data = {
            "project_id": project_id,
            "user_uuid": str(current_user.get("id")),
            "title": title,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%H:%M"),
            "duration": "N/A",
            "source_type": "MANUAL_UPLOAD",
            "mom_summary": "\n".join(mom_data.get("poin_diskusi", [])),
            "key_decisions": mom_data.get("keputusan_final", []),
            "action_items": [
                {
                    "task": t["title"],
                    "initials": "".join([n[0] for n in (t.get("assignee_username") or "??").split()]).upper()[:2],
                    "deadline": t.get("due_date") or "TBD"
                } for t in proposed_tasks
            ]
        }
        
        db_meeting = None
        try:
            db_meeting = await create_meeting_record(meeting_data)
            meeting_id = db_meeting.get("id") if db_meeting else "not-saved"
        except Exception as db_err:
            print(f"Auto-save failed: {db_err}")
            meeting_id = "not-saved"

        # 2. Generasikan Alert ONLY after attempting to save
        alert_id = await _create_draft_approval_alert(
            user_uuid=str(current_user.get("id")), 
            project_id=project_id, 
            meeting_title=title
        )

        return {
            "status": "success",
            "meeting_id": meeting_id,
            "meeting": db_meeting, # Return the whole record for frontend history update
            "alert_id": alert_id,
            "proposed_tasks": proposed_tasks,
            "data": analysis_result
        }

    except Exception as e:
        print(f"Error Sistem: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal.")
    finally:
        await file.close()





@router.post("/invite-bot", tags=["Recall.ai"])
async def invite_meeting_bot(
    meeting_url: str, 
    project_id: int,
    current_user: dict = Depends(get_current_user) 
):
    # Gunakan ID GitHub sebagai referensi webhook
    user_uuid = str(current_user.get("id"))
    
    payload = {
        "meeting_url": meeting_url,
        "bot_name": "Equilibra AI Bot",
        "metadata": {
            "user_uuid": user_uuid,
            "project_id": project_id
        } 
    }
    
    print(f"Menggunakan API Key Recall: {settings.recall_api_key[:5]}... (disensor)")
    
    headers = {
        "Authorization": f"Token {settings.recall_api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client_http:
        url = "https://ap-northeast-1.recall.ai/api/v1/bot/"
        response = await client_http.post(url, json=payload, headers=headers)
        
    if response.status_code != 201:
        error_detail = response.text
        print(f"❌ ERROR DARI RECALL.AI: {error_detail}")
        raise HTTPException(status_code=400, detail=f"Gagal mengundang bot. Jawaban Recall: {error_detail}")
        
    return {"status": "bot_joining", "bot_id": response.json()["id"]}

# ==========================================
# FUNGSI PEKERJA BELAKANG LAYAR (BACKGROUND TASK)
# ==========================================
async def process_video_in_background(bot_id: str, user_uuid: str, project_id: int):
    print(f"🔍 [BACKGROUND] Mengambil detail video untuk Bot ID: {bot_id}...")
    headers = {
        "Authorization": f"Token {settings.recall_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client_http:
            api_url = f"https://ap-northeast-1.recall.ai/api/v1/bot/{bot_id}"
            bot_res = await client_http.get(api_url, headers=headers)
            
            if bot_res.status_code != 200:
                print(f"❌ [BACKGROUND] Gagal mengambil data bot: {bot_res.text}")
                return
            
            bot_detail = bot_res.json()
            video_url = None
            recordings = bot_detail.get("recordings", [])
            
            if recordings:
                media = recordings[0].get("media_shortcuts", {})
                video_mixed = media.get("video_mixed", {})
                if video_mixed and video_mixed.get("data"):
                    video_url = video_mixed["data"].get("download_url")
            
            if not video_url:
                print("⚠️ [BACKGROUND] Video URL kosong di data bot.")
                return
                
            print(f"🎥 [BACKGROUND] Video URL ditemukan! Mendownload...")
            video_res = await client_http.get(video_url, timeout=120.0)
            
        print("🤖 [BACKGROUND] Video didownload, mengirim ke Gemini...")
        
        response = await client.aio.models.generate_content(
            model=MODEL_ID,
            contents=[
                GEMINI_SYSTEM_PROMPT,
                types.Part.from_bytes(data=video_res.content, mime_type="video/mp4")
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        analysis_result = await _parse_gemini_response(response)
        print("✅ [BACKGROUND] ANALISIS SELESAI!")
        
        # Prepare proposed tasks
        proposed_tasks = _build_proposed_tasks(analysis_result.get("action_items", []))
        
        # Generasikan Alert
        meeting_title = analysis_result.get("mom", {}).get("judul_meeting", "Meeting Tanpa Judul")
        alert_id = await _create_draft_approval_alert(
            user_uuid=user_uuid, 
            project_id=project_id, 
            meeting_title=meeting_title
        )
        
        # Consistent payload with /analyze-meeting
        full_payload = {
            "status": "success",
            "meeting_id": f"bg-{bot_id}",
            "alert_id": alert_id,
            "proposed_tasks": proposed_tasks,
            "data": analysis_result,
            "mom_content": json.dumps(analysis_result), # For polling compat
            "title": meeting_title
        }
        
       
        
        # Store in-memory for now
        if user_uuid not in TEMP_ANALYSIS_RESULTS:
            TEMP_ANALYSIS_RESULTS[user_uuid] = []
        TEMP_ANALYSIS_RESULTS[user_uuid].insert(0, full_payload)
        
        print("💾 [BACKGROUND] Menyiapkan payload untuk DB Postgres...")
        
        # Save directly to the DB now!
        await create_meeting_record({
             "project_id": project_id,
             "user_uuid": user_uuid,
             "title": meeting_title,
             "date": "TBD",
             "time": "TBD",
             "duration": "TBD",
             "source_type": "RECALL_BOT",
             "mom_summary": "\n".join(analysis_result.get("mom", {}).get("poin_diskusi", [])),
             "key_decisions": analysis_result.get("mom", {}).get("keputusan_final", []),
             "action_items": analysis_result.get("action_items", [])
        })
        print("💾 [BACKGROUND] Data berhasil disimpan ke Postgres.")
        
    except Exception as e:
        print(f"❌ [BACKGROUND] Gagal memproses: {str(e)}")


# ==========================================
# ENDPOINT WEBHOOK UTAMA 
# ==========================================
@router.post("/webhooks/recall", include_in_schema=False)
async def recall_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
    except Exception:
        return {"status": "error", "detail": "Invalid JSON"}

    event_type = data.get("event", "UNKNOWN")
    print(f"\n==============================")
    print(f"WEBHOOK DITERIMA: {event_type}")
    print(f"==============================")
    
    if event_type == "bot.done":
        
        bot_data = data.get("data", {})
        if "bot" in bot_data: 
            bot_data = bot_data["bot"]
            
        bot_id = bot_data.get("id")
        
        user_uuid = bot_data.get("metadata", {}).get("user_uuid")
        project_id = bot_data.get("metadata", {}).get("project_id", 0)
        
        if not bot_id or not user_uuid:
            print("❌ Bot ID atau User UUID tidak ditemukan di webhook.")
            return {"status": "error", "message": "Missing identifiers"}

        background_tasks.add_task(process_video_in_background, bot_id, user_uuid, project_id)
        
        print("⚡ Merespons Recall.ai secepat kilat agar tidak timeout...")
        return {"status": "accepted", "message": "Proses AI sedang berjalan di latar belakang"}

    return {"status": "ignored", "event": event_type}


# ==========================================
# CONFIRM TASKS (Human-in-the-Loop)
# ==========================================
@router.post("/meetings/confirm-tasks")
def confirm_meeting_tasks(
    body: ConfirmTasksRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Batch-insert selected tasks from a meeting analysis and mark the
    originating alert as resolved. The entire operation runs inside a
    single transaction — if any INSERT fails the alert is NOT updated.
    """
    if not body.tasks:
        raise HTTPException(status_code=400, detail="No tasks provided")

    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Batch-insert tasks
        for task in body.tasks:
            task_id = _generator.generate()
            mapping = {
                "id": task_id,
                "project_id": task.project_id,
                "bucket_id": task.bucket_id,
                "title": task.title,
                "description": task.description,
                "type": task.type or "OTHER",
                "weight": task.weight if task.weight is not None else 3,
            }
            columns = [k for k, v in mapping.items() if v is not None]
            placeholders = ["%s"] * len(columns)
            params = [mapping[k] for k in columns]

            sql = (
                f"INSERT INTO public.tasks ({', '.join(columns)}) "
                f"VALUES ({', '.join(placeholders)});"
            )
            cur.execute(sql, params)

        # 2. Resolve the alert
        cur.execute(
            "UPDATE public.alerts SET is_resolved = true, updated_at = NOW() "
            "WHERE id = %s;",
            (body.alert_id,),
        )

        conn.commit()
        return {"status": "success", "inserted": len(body.tasks)}

    except psycopg2.errors.ForeignKeyViolation as e:
        conn.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Constraint violation (foreign key): {e.pgerror or str(e)}",
        )
    except psycopg2.errors.UniqueViolation as e:
        conn.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Constraint violation (unique): {e.pgerror or str(e)}",
        )
    except psycopg2.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Integrity error: {e.pgerror or str(e)}",
        )
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