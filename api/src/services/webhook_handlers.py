import logging
from services.database.tasks import DatabaseTask, db_update_task
from services.database.activities import DatabaseActivity, db_create_activity
from fastapi import BackgroundTasks
from services.database.database import _get_conn, _put_conn
import psycopg2.extras
import re
from github_app import get_github_client
from services.database.id_generator import _generator

logger = logging.getLogger("uvicorn.error")

async def process_github_event(payload: dict, event: str, pool=None):
    action = payload.get("action", "")

    if event == "pull_request":
        if action == "opened":
            await on_pr_opened(payload, pool)
        elif action == "reopened":
            await on_pr_reopened(payload, pool)
        elif action == "synchronize":
            await on_pr_synchronize(payload, pool)
        elif action == "closed":
            await on_pr_closed(payload, pool)
            
    elif event == "pull_request_review":
        if action == "submitted":
            await on_pr_review_submitted(payload, pool)

async def sync_github_tasks(payload: dict):
    """Synchronization of tasks from GitHub tasks.md files to local DB."""
    repo_full_name = payload.get("repository", {}).get("full_name")
    repo_url = payload.get("repository", {}).get("html_url")
    installation_id = payload.get("installation", {}).get("id")
    
    if not repo_full_name or not installation_id:
        return

    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)
        
        # 1. Sweep for tasks.md files in openspec/changes/
        try:
            contents = repo.get_contents("openspec/changes")
        except:
            logger.info(f"No openspec/changes directory found in {repo_full_name}")
            return

        all_tasks = []
        for item in contents:
            if item.type == "dir":
                try:
                    task_files = repo.get_contents(item.path)
                    for tf in task_files:
                        if tf.name == "tasks.md":
                            content = tf.decoded_content.decode("utf-8")
                            # Simple parser for - [ ] Task Title
                            lines = content.splitlines()
                            for line in lines:
                                match = re.search(r"^- \[[ xX]\] (.*)$", line)
                                if match:
                                    all_tasks.append(match.group(1).strip())
                except Exception as e:
                    logger.warning(f"Error reading tasks.md in {item.path}: {e}")
                    continue
        
        if not all_tasks:
            logger.info(f"No tasks found in openspec/changes/ for {repo_full_name}")
            return

        # 2. Sync with DB
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Find project by repo URL
            cur.execute("SELECT id FROM public.projects WHERE %s = ANY(gh_repo_url) LIMIT 1;", (repo_url,))
            project_row = cur.fetchone()
            
            if not project_row:
                # Zero-Config: Create project
                project_id = _generator.generate()
                cur.execute(
                    "INSERT INTO public.projects (id, name, gh_repo_url) VALUES (%s, %s, %s) RETURNING id;",
                    (project_id, repo_full_name.split("/")[-1], [repo_url])
                )
                project_id = cur.fetchone()["id"]
                
                # Create default DRAFT bucket
                bucket_id = _generator.generate()
                cur.execute(
                    "INSERT INTO public.buckets (id, project_id, name, state, is_system_locked, order_idx) "
                    "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;",
                    (bucket_id, project_id, "AI Drafts", "DRAFT", True, 0)
                )
                target_bucket_id = cur.fetchone()["id"]
                logger.info(f"Zero-Config: Created project {project_id} and DRAFT bucket for {repo_full_name}")
            else:
                project_id = project_row["id"]
                # Find DRAFT bucket
                cur.execute("SELECT id FROM public.buckets WHERE project_id = %s AND state = 'DRAFT' LIMIT 1;", (project_id,))
                bucket_row = cur.fetchone()
                if bucket_row:
                    target_bucket_id = bucket_row["id"]
                else:
                    # Create if missing
                    bucket_id = _generator.generate()
                    cur.execute(
                        "INSERT INTO public.buckets (id, project_id, name, state, is_system_locked, order_idx) "
                        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;",
                        (bucket_id, project_id, "AI Drafts", "DRAFT", True, 0)
                    )
                    target_bucket_id = cur.fetchone()["id"]

            # Upsert tasks
            created_count = 0
            for task_title in all_tasks:
                # Check if task already exists
                cur.execute("SELECT id FROM public.tasks WHERE project_id = %s AND title = %s LIMIT 1;", (project_id, task_title))
                if cur.fetchone():
                    continue
                
                # Insert new task
                task_id = _generator.generate()
                cur.execute(
                    "INSERT INTO public.tasks (id, project_id, bucket_id, title, type, weight) VALUES (%s, %s, %s, %s, 'CODE', 1);",
                    (task_id, project_id, target_bucket_id, task_title)
                )
                created_count += 1
            
            conn.commit()
            if created_count > 0:
                logger.info(f"Successfully synced {created_count} new tasks for {repo_full_name}")
        except Exception as e:
            conn.rollback()
            logger.error(f"Error syncing tasks to DB for {repo_full_name}: {e}")
        finally:
            cur.close()
            _put_conn(conn)
            
    except Exception as e:
        logger.error(f"Error fetching tasks from GitHub for {repo_full_name}: {e}")

async def on_pr_opened(payload: dict, pool=None):
    # 1. AI Evaluation
    from services.pr_evaluator import process_pr_evaluation
    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})
    installation_id = payload.get("installation", {}).get("id")
    if all([pr.get("number"), repo.get("full_name"), installation_id]):
        await process_pr_evaluation(repo["full_name"], pr["number"], installation_id)
    
    # 2. Task Synchronization (Placeholder)
    await sync_github_tasks(payload)
    
    # 3. Legacy State Management
    await handle_pr_opened(payload)

async def on_pr_reopened(payload: dict, pool=None):
    # Similar to opened
    from services.pr_evaluator import process_pr_evaluation
    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})
    installation_id = payload.get("installation", {}).get("id")
    if all([pr.get("number"), repo.get("full_name"), installation_id]):
        await process_pr_evaluation(repo["full_name"], pr["number"], installation_id)
        
    await sync_github_tasks(payload)
    await handle_pr_opened(payload)

async def on_pr_synchronize(payload: dict, pool=None):
    from services.pr_evaluator import process_pr_evaluation
    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})
    installation_id = payload.get("installation", {}).get("id")
    if all([pr.get("number"), repo.get("full_name"), installation_id]):
        await process_pr_evaluation(repo["full_name"], pr["number"], installation_id)
        
    await sync_github_tasks(payload)

async def on_pr_closed(payload: dict, pool=None):
    # 1. KPI and Scoring
    await process_kpi_score(payload, pool)
    
    # 2. Task Synchronization (Placeholder)
    await sync_github_tasks(payload)
    
    # 3. Legacy State Management
    await handle_pr_closed(payload)

async def on_pr_review_submitted(payload: dict, pool=None):
    # 1. KPI and Scoring for approvals
    await process_review_kpi(payload, pool)
    
    # 2. Legacy State Management
    await handle_pr_review_submitted(payload)


async def process_kpi_score(payload: dict, pool=None):
    # Completion Event (Merge): lead_assignee_id receives W * 1.0
    pr = payload.get("pull_request", {})
    if not pr.get("merged"):
        return

    branch_name = pr.get("head", {}).get("ref", "")
    
    task_match = re.search(r"^.*?(\d+)-.*$", branch_name)
    if not task_match:
        task_match = re.search(r"(\d+)", branch_name)
        
    if not task_match:
        logger.info("KPI score (completion) not updated: couldn't find task ID in branch")
        return
        
    task_id = int(task_match.group(1))
    
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("BEGIN;")
        
        cur.execute("SELECT id, project_id, weight, lead_assignee_id FROM public.tasks WHERE id = %s LIMIT 1;", (task_id,))
        task_row = cur.fetchone()
        if not task_row:
            logger.info(f"Task {task_id} not found in DB.")
            cur.execute("ROLLBACK;")
            return
            
        project_id = task_row["project_id"]
        weight = task_row["weight"] or 0
        lead_assignee_id = task_row["lead_assignee_id"]
        
        if lead_assignee_id:
            score_delta = weight * 1.0
            cur.execute(
                "UPDATE public.project_member "
                "SET kpi_score = kpi_score + %s "
                "WHERE user_id = %s AND project_id = %s;",
                (score_delta, lead_assignee_id, project_id)
            )
        
        cur.execute("SELECT id FROM public.buckets WHERE project_id = %s AND state = 'COMPLETED' LIMIT 1;", (project_id,))
        bucket_row = cur.fetchone()
        completed_bucket_id = bucket_row["id"] if bucket_row else None
        
        if completed_bucket_id:
            cur.execute(
                "UPDATE public.tasks SET bucket_id = %s, updated_at = NOW() WHERE id = %s;",
                (completed_bucket_id, task_id)
            )
            
        cur.execute("COMMIT;")
        if lead_assignee_id:
            logger.info(f"Successfully processed merge KPI for task {task_id}, assignee {lead_assignee_id}, delta {score_delta}")
        
    except Exception as e:
        if cur:
            cur.execute("ROLLBACK;")
        logger.error(f"Error processing KPI atomic update: {e}")
    finally:
        if cur:
            cur.close()
        _put_conn(conn)


async def process_review_kpi(payload: dict, pool=None):
    # Review Event (Approval): Reviewer receives W * 0.2
    review = payload.get("review", {})
    if review.get("state") != "approved":
        return

    pr = payload.get("pull_request", {})
    branch_name = pr.get("head", {}).get("ref", "")
    author_username = pr.get("user", {}).get("login")
    reviewer_username = review.get("user", {}).get("login")
    
    if not reviewer_username or reviewer_username == author_username:
        logger.info("KPI score not updated: reviewer is author or missing")
        return

    task_match = re.search(r"^.*?(\d+)-.*$", branch_name)
    if not task_match:
        task_match = re.search(r"(\d+)", branch_name)
        
    if not task_match:
        return
        
    task_id = int(task_match.group(1))
    
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("BEGIN;")
        
        cur.execute("SELECT id FROM public.users WHERE gh_username = %s LIMIT 1;", (reviewer_username,))
        reviewer_row = cur.fetchone()
        if not reviewer_row:
            logger.info(f"Reviewer {reviewer_username} not found in DB.")
            cur.execute("ROLLBACK;")
            return
            
        reviewer_id = reviewer_row["id"]
        
        cur.execute("SELECT id, project_id, weight FROM public.tasks WHERE id = %s LIMIT 1;", (task_id,))
        task_row = cur.fetchone()
        if not task_row:
            cur.execute("ROLLBACK;")
            return
            
        project_id = task_row["project_id"]
        weight = task_row["weight"] or 0
        score_delta = weight * 0.2
        
        cur.execute(
            "UPDATE public.project_member "
            "SET kpi_score = kpi_score + %s "
            "WHERE user_id = %s AND project_id = %s;",
            (score_delta, reviewer_id, project_id)
        )
            
        cur.execute("COMMIT;")
        logger.info(f"Successfully processed review KPI for task {task_id}, reviewer {reviewer_username}, delta {score_delta}")
        
    except Exception as e:
        if cur:
            cur.execute("ROLLBACK;")
        logger.error(f"Error processing review KPI update: {e}")
    finally:
        if cur:
            cur.close()
        _put_conn(conn)



def find_project_bucket_by_state(repo_url: str, target_state: str):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id FROM public.projects WHERE %s = ANY(gh_repo_url) LIMIT 1;",
            (repo_url,)
        )
        project_row = cur.fetchone()
        if not project_row: return None
        
        # The Magic Query
        cur.execute(
            "SELECT id FROM public.buckets WHERE project_id = %s AND state = %s AND is_deleted = False ORDER BY order_idx ASC LIMIT 1;", 
            (project_row["id"], target_state)
        )
        bucket_row = cur.fetchone()
        
        bucket_id = bucket_row["id"] if bucket_row else None
        return project_row["id"], bucket_id
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)

def find_task_by_branch(project_id: int, branch_name: str):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, title, type, weight FROM public.tasks WHERE project_id = %s AND branch_name = %s LIMIT 1;",
            (project_id, branch_name)
        )
        return cur.fetchone()
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)

async def handle_pr_closed(payload: dict):
    pr = payload.get("pull_request", {})
    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")
    gh_username = pr.get("user", {}).get("login", "Unknown")

    if not repo_url or not branch_name:
        return

    is_merged = pr.get("merged", False)
    target_state = 'COMPLETED' if is_merged else 'ONGOING'

    project_data = find_project_bucket_by_state(repo_url, target_state)
    if not project_data: return
    project_id, target_bucket_id = project_data

    task = find_task_by_branch(project_id, branch_name)
    if not task: return
    
    if not target_bucket_id:
        logger.error(f"Project {project_id} is missing a bucket with state '{target_state}'")
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=target_bucket_id, title=task.get("title", ""), type=task.get("type", "CODE"), weight=task.get("weight", 0)), BackgroundTasks()) 
        logger.info(f"Moved task {task['id']} to bucket {target_bucket_id}.")
        
        action_msg = "merged" if is_merged else "closed without merging"
        db_create_activity(DatabaseActivity(
            project_id=project_id,
            user_name=gh_username,
            action=action_msg,
            target=f"PR for {branch_name}"
        ))
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")

async def handle_pr_opened(payload: dict):
    pr = payload.get("pull_request", {})
    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")
    gh_username = pr.get("user", {}).get("login", "Unknown")

    if not repo_url or not branch_name:
        return

    project_data = find_project_bucket_by_state(repo_url, "ON_REVIEW")
    if not project_data: return
    project_id, target_bucket_id = project_data
    
    if not target_bucket_id: 
        logger.error(f"Project {project_id} is missing a bucket with state 'ON_REVIEW'")
        return

    task = find_task_by_branch(project_id, branch_name)
    if not task:
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=target_bucket_id, title=task.get("title", ""), type=task.get("type", "CODE"), weight=task.get("weight", 0)), BackgroundTasks())
        logger.info(f"Moved task {task['id']} to bucket {target_bucket_id}.")
        db_create_activity(DatabaseActivity(
            project_id=project_id,
            user_name=gh_username,
            action="opened",
            target=f"PR for {branch_name}"
        ))
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")

async def handle_pr_review_submitted(payload: dict):
    review = payload.get("review", {})
    state = review.get("state")
    
    if state != "changes_requested":
        return

    pr = payload.get("pull_request", {})
    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")
    gh_username = review.get("user", {}).get("login", "Unknown")

    if not repo_url or not branch_name:
        return

    project_data = find_project_bucket_by_state(repo_url, "ONGOING")
    if not project_data: return
    project_id, target_bucket_id = project_data
    
    if not target_bucket_id: 
        logger.error(f"Project {project_id} is missing a bucket with state 'ONGOING'")
        return

    task = find_task_by_branch(project_id, branch_name)
    if not task:
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=target_bucket_id, title=task.get("title", ""), type=task.get("type", "CODE"), weight=task.get("weight", 0)), BackgroundTasks())
        logger.info(f"Moved task {task['id']} to bucket {target_bucket_id}.")
        db_create_activity(DatabaseActivity(
            project_id=project_id,
            user_name=gh_username,
            action="requested changes on",
            target=f"PR for {branch_name}"
        ))
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")
