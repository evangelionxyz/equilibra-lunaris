import asyncio
import json
import secrets
import re
import fastapi
from fastapi import APIRouter, HTTPException, UploadFile, File, Request, BackgroundTasks
import httpx
from google import genai
from google.genai import types
from config import settings

router = APIRouter(tags=["Meetings"])

# ==========================================
# MOCK DATABASE (Tiruan agar tidak error DB)
# ==========================================
async def list_meetings_for_user(uuid: str):
    return [{"id": "mock-123", "title": "Bypass Test Meeting"}]

async def create_meeting_for_user(user_uuid: str, title: str, mom_content: str):
    return {"id": f"mock-meeting-{secrets.token_hex(4)}", "title": title}

# ==========================================
# KONFIGURASI BYPASS
# ==========================================
MOCK_USER_UUID = "test-user-bypass-12345" 
MODEL_ID = "gemini-2.5-flash"
client = genai.Client(api_key=settings.gemini_api_key)

GEMINI_SYSTEM_PROMPT = """
Role: Expert Project Manager dan AI Transcriber.
Task: Analisis data meeting untuk membuat Minutes of Meeting (MOM) dan Action Items (Task).
Output: WAJIB JSON valid tanpa teks tambahan.
Language: Bahasa Indonesia.

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
    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned_text, re.DOTALL)
    if fenced_match:
        cleaned_text = fenced_match.group(1).strip()
    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        start = cleaned_text.find("{")
        end = cleaned_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(cleaned_text[start:end + 1])

def _parse_gemini_response(response: object) -> dict:
    response_text = str(getattr(response, "text", "") or "").strip()
    if not response_text:
        raise ValueError("Gemini response text is empty")
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
# ENDPOINTS (TANPA LOGIN)
# ==========================================
@router.get("/meetings")
async def get_meetings():
    return await list_meetings_for_user(MOCK_USER_UUID)

@router.post("/analyze-meeting", tags=["AI"])
async def analyze_meeting_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith(("audio/", "video/")):
        raise HTTPException(status_code=400, detail="File harus berupa audio atau video.")

    try:
        input_bytes = await file.read()
        mime_type = file.content_type

        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model=MODEL_ID,
                    contents=[
                        GEMINI_SYSTEM_PROMPT,
                        types.Part.from_bytes(data=input_bytes, mime_type=mime_type)
                    ],
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                ),
                timeout=90.0 
            )
        except asyncio.TimeoutError as exc:
            print(f"Gemini timeout: {exc}")
            return _fallback_analysis_payload("timeout")
        except Exception as exc:
            print(f"Gemini request failed: {exc}")
            return _fallback_analysis_payload("request-error")

        try:
            analysis_result = _parse_gemini_response(response)
        except Exception as exc:
            print(f"Gemini JSON parse failed: {exc}")
            return _fallback_analysis_payload("invalid-json")

        mom_data = analysis_result.get("mom", {})
        title = mom_data.get("judul_meeting") or "Meeting Tanpa Judul"
        mom_content = json.dumps(mom_data)

        # Simpan ke Mock DB
        meeting = await create_meeting_for_user(MOCK_USER_UUID, title, mom_content)
        proposed_tasks = _build_proposed_tasks(analysis_result.get("action_items", []))

        return {
            "status": "success",
            "meeting_id": meeting["id"],
            "proposed_tasks": proposed_tasks,
            "data": analysis_result
        }
    except Exception as e:
        print(f"Error Sistem: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal.")
    finally:
        await file.close()

@router.post("/invite-bot", tags=["Recall.ai"])
async def invite_meeting_bot(meeting_url: str):
    payload = {
        "meeting_url": meeting_url,
        "bot_name": "Equilibra AI Bot",
        # Hapus dulu transcription_options untuk jaga-jaga (opsional kok ini)
        "metadata": {"user_uuid": MOCK_USER_UUID} 
    }
    
    # Cek apakah API key terbaca (akan tampil di terminal)
    print(f"Menggunakan API Key Recall: {settings.recall_api_key[:5]}... (disensor)")
    
    headers = {
        # Pastikan formatnya "Token <api_key>" sesuai dokumentasi Recall
        "Authorization": f"Token {settings.recall_api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client_http:
        # URL KHUSUS UNTUK REGION TOKYO (ap-northeast-1)
        url = "https://ap-northeast-1.recall.ai/api/v1/bot/"
        
        response = await client_http.post(
            url, 
            json=payload, 
            headers=headers
        )
        
    # --- PERBAIKAN UNTUK DEBUGGING ---
    if response.status_code != 201:
        error_detail = response.text # Ambil pesan error ASLI dari Recall
        print(f"❌ ERROR DARI RECALL.AI: {error_detail}")
        raise HTTPException(
            status_code=400, 
            detail=f"Gagal mengundang bot. Jawaban Recall: {error_detail}"
        )
        
    return {"status": "bot_joining", "bot_id": response.json()["id"]}

# ==========================================
# FUNGSI PEKERJA BELAKANG LAYAR (BACKGROUND TASK)
# ==========================================
async def process_video_in_background(bot_id: str):
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
            
            # Ekstrak URL Video
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
        
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=MODEL_ID,
                contents=[
                    GEMINI_SYSTEM_PROMPT,
                    types.Part.from_bytes(data=video_res.content, mime_type="video/mp4")
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            ),
            timeout=120.0 
        )
        
        analysis_result = _parse_gemini_response(response)
        
        print("✅ [BACKGROUND] ANALISIS SELESAI!")
        
        # Simpan ke Database
        await create_meeting_for_user(
            user_uuid=MOCK_USER_UUID,
            title=analysis_result["mom"]["judul_meeting"],
            mom_content=json.dumps(analysis_result)
        )
        print("💾 [BACKGROUND] Data berhasil disimpan ke Database.")
        
    except Exception as e:
        print(f"❌ [BACKGROUND] Gagal memproses: {str(e)}")


# ==========================================
# ENDPOINT WEBHOOK UTAMA (CEPAT TANGGAP)
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
        bot_id = data.get("data", {}).get("bot", {}).get("id")
        
        if not bot_id:
            print("❌ Bot ID tidak ditemukan di webhook.")
            return {"status": "error"}

        # Langsung lemparkan tugas berat ke background task
        background_tasks.add_task(process_video_in_background, bot_id)
        
        print("⚡ Merespons Recall.ai secepat kilat agar tidak timeout...")
        # Return 200 OK ke Recall seketika itu juga!
        return {"status": "accepted", "message": "Proses AI sedang berjalan di latar belakang"}

    return {"status": "ignored", "event": event_type}