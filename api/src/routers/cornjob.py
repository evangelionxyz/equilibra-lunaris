from datetime import datetime, timedelta, timezone
from celery import Celery
from celery.schedules import crontab
from supabase import create_client, Client
import httpx

from config import settings

# Initialize Celery & Supabase
app = Celery("stagnation_jobs", broker=getattr(settings, "redis_url", "redis://localhost:6379/0"))
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

def get_min_workload_user(project_id: int, current_assignee_id: int):
    """Finds the developer in the project with the lowest current_load"""
    response = supabase.table("project_members") \
        .select("user_id, current_load") \
        .eq("project_id", project_id) \
        .in_("role", ["PROGRAMMER", "DESIGNER"]) \
        .execute()
    
    members = response.data
    if not members:
        return None

    # Filter out the current assignee and find the minimum load
    eligible_members = [m for m in members if m["user_id"] != current_assignee_id]
    
    if not eligible_members:
        return None

    best_candidate = min(eligible_members, key=lambda x: x["current_load"])
    return best_candidate["user_id"]

def find_project_manager(project_id: int):
    """Finds the PM of a project to send them the Alert"""
    response = supabase.table("project_members") \
        .select("user_id") \
        .eq("project_id", project_id) \
        .eq("role", "MANAGER") \
        .execute()
    
    if response.data:
        return response.data[0]["user_id"]
    return None

def run_stagnation_radar():
    print(f"📡 [{datetime.now(timezone.utc)}] Running Stagnation Radar...")
    
    # 1. FIND ONGOING BUCKETS
    bucket_res = supabase.table("buckets").select("id").eq("system_state", "ONGOING").execute()
    ongoing_bucket_ids = [b["id"] for b in bucket_res.data]
    
    if not ongoing_bucket_ids:
        print("✅ No ONGOING buckets found.")
        return

    # 2. FIND STAGNANT TASKS (> 48 hours without activity)
    threshold = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    
    task_res = supabase.table("tasks") \
        .select("id, title, project_id, lead_assignee_id, suggested_assignee_id") \
        .in_("bucket_id", ongoing_bucket_ids) \
        .lt("last_activity_at", threshold) \
        .execute()
    
    stagnant_tasks = task_res.data

    if not stagnant_tasks:
        print("✅ Clean: No stagnant tasks found.")
        return

    for task in stagnant_tasks:
        # Prevent double-processing if we already suggested someone
        if task.get("suggested_assignee_id") is not None:
            continue
            
        task_id = task["id"]
        project_id = task["project_id"]
        assignee_id = task.get("lead_assignee_id")
        
        print(f"⚠️ Stagnation detected on Task ID {task_id}")

        # 3. NUDGE THE DEVELOPER (via Telegram)
        if assignee_id and settings.telegram_bot_token:
            user_res = supabase.table("users").select("telegram_chat_id").eq("id", assignee_id).execute()
            if user_res.data and user_res.data[0].get("telegram_chat_id"):
                chat_id = user_res.data[0]["telegram_chat_id"]
                pesan = (
                    f"🔔 *STAGNATION RADAR ALERT*\n\n"
                    f"Task: *{task.get('title')}*\n"
                    f"No activity detected in the last 48 hours.\n\n"
                    f"Please update the GitHub branch or the task will be proposed for reallocation."
                )
                try:
                    # Sync HTTP request
                    httpx.post(
                        f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                        json={"chat_id": chat_id, "text": pesan, "parse_mode": "Markdown"}
                    )
                except Exception as e:
                    print(f"⚠️ Failed to send Telegram to {chat_id}: {e}")

        # 4. ORCHESTRATION: PROPOSE REALLOCATION
        new_assignee_id = get_min_workload_user(project_id, assignee_id)
        
        if new_assignee_id:
            # Update Task with the suggested assignee
            supabase.table("tasks").update({
                "suggested_assignee_id": new_assignee_id
            }).eq("id", task_id).execute()
            
            # 5. ALERT THE PROJECT MANAGER
            pm_id = find_project_manager(project_id)
            if pm_id:
                supabase.table("alerts").insert({
                    "user_id": pm_id,
                    "type": "STAGNATION",
                    "context_id": task_id,
                    "is_resolved": False
                }).execute()
                print(f"🔄 Suggested reallocation for Task {task_id}. Alerted PM {pm_id}.")

# --- CELERY TASK WRAPPER ---
@app.task(name="check_stagnation_and_orchestrate")
def check_stagnation_and_orchestrate():
    run_stagnation_radar()

# --- SCHEDULER CONFIG ---
app.conf.beat_schedule = {
    "run-stagnation-hourly": {
        "task": "check_stagnation_and_orchestrate",
        "schedule": crontab(minute='*'), # HACKATHON DEMO OVERRIDE: Runs every 1 minute
    },
}