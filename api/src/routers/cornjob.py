import asyncio
from datetime import datetime, timedelta, timezone
from celery import Celery
from celery.schedules import crontab
from supabase import create_client, Client
import httpx


from config import settings 


app = Celery("stagnation_jobs", broker="redis://localhost:6379/0")

# Inisialisasi Supabase Client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

async def run_stagnation_radar():
    print(f"📡 [{datetime.now()}] Memulai Stagnation Radar...")
    
    # 1. QUERY STAGNATION RADAR (Stagnation Radar Logic)
    # Mencari task IN_FLOW yang tidak ada aktivitas > 48 jam
    threshold = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    
    # Ambil task sekaligus join dengan data user untuk notifikasi
    response = supabase.table("tasks") \
        .select("*, users(telegram_chat_id, display_name)") \
        .eq("status", "IN_FLOW") \
        .lt("last_activity_at", threshold) \
        .execute()
    
    stagnant_tasks = response.data

    if not stagnant_tasks:
        print("✅ Clean: Tidak ada task yang stagnan.")
        return

    for task in stagnant_tasks:
        user_data = task.get("users")
        chat_id = user_data.get("telegram_chat_id") if user_data else None
        
        # 2. TRIGGER TELEGRAM NUDGE
        if chat_id and settings.telegram_bot_token:
            async with httpx.AsyncClient() as client:
                pesan = (
                    f"🔔 *STAGNATION RADAR ALERT*\n\n"
                    f"Task: *{task.get('title', 'Untitled Task')}*\n"
                    f"Sudah tidak ada aktivitas selama > 48 jam.\n\n"
                    f"Mohon segera selesaikan atau task akan direalokasi otomatis."
                )
                try:
                    await client.post(
                        f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                        json={"chat_id": chat_id, "text": pesan, "parse_mode": "Markdown"}
                    )
                except Exception as e:
                    print(f"⚠️ Gagal kirim Telegram ke {chat_id}: {e}")

        # 3. WORKLOAD ORCHESTRATION (min Wu Calculation)
        # Mencari user yang paling sedikit menangani task 'IN_FLOW'
        new_assignee_id = await calculate_min_workload_user()
        
        if new_assignee_id and new_assignee_id != task['assigned_to']:
            # Auto-Reallocation
            supabase.table("tasks").update({
                "assigned_to": new_assignee_id,
                "last_activity_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", task['id']).execute()
            
            print(f"🔄 Task '{task['id']}' direalokasi ke User: {new_assignee_id}")

async def calculate_min_workload_user():
    """Menghitung beban kerja (Wu) untuk menentukan target realokasi"""
    res = supabase.table("tasks") \
        .select("assigned_to") \
        .eq("status", "IN_FLOW") \
        .execute()
    
    if not res.data:
        return None

    # Count tasks per user
    workload_map = {}
    for item in res.data:
        uid = item['assigned_to']
        workload_map[uid] = workload_map.get(uid, 0) + 1
    
    # Cari User ID dengan value (jumlah task) paling kecil
    return min(workload_map, key=workload_map.get)

# --- CELERY TASK WRAPPER ---

@app.task(name="check_stagnation_and_orchestrate")
def check_stagnation_and_orchestrate():
    # Menjalankan fungsi async di dalam synchronous Celery task
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_stagnation_radar())

# --- SCHEDULER CONFIG ---

app.conf.beat_schedule = {
    "run-stagnation-hourly": {
        "task": "check_stagnation_and_orchestrate",
        "schedule": crontab(minute=0), # Berjalan setiap jam (jam 1:00, 2:00, dst)
    },
}