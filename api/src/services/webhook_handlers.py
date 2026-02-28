import logging
from services.database.projects import db_get_project_by_id, db_update_project
from services.database.tasks import DatabaseTask, db_update_task
from services.database.database import _get_conn, _put_conn
import psycopg2.extras

logger = logging.getLogger("uvicorn.error")

def find_project_by_repo_url(repo_url: str):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # gh_repo_url is character varying[]
        cur.execute(
            "SELECT id, completed_bucket_id, in_review_bucket_id, todo_bucket_id FROM public.projects WHERE %s = ANY(gh_repo_url) LIMIT 1;",
            (repo_url,)
        )
        return cur.fetchone()
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
            "SELECT id FROM public.tasks WHERE project_id = %s AND branch_name = %s LIMIT 1;",
            (project_id, branch_name)
        )
        return cur.fetchone()
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)

async def handle_pr_closed(payload: dict):
    pr = payload.get("pull_request", {})
    if not pr.get("merged"):
        logger.info(f"PR #{pr.get('number')} closed without merge. Skipping task movement.")
        return

    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")

    if not repo_url or not branch_name:
        logger.warning("Missing repo_url or branch_name in PR payload.")
        return

    project = find_project_by_repo_url(repo_url)
    if not project or not project.get("completed_bucket_id"):
        logger.info(f"No project found for repo {repo_url} or completed_bucket_id not set.")
        return

    task = find_task_by_branch(project["id"], branch_name)
    if not task:
        logger.info(f"No task found for branch {branch_name} in project {project['id']}.")
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=project["completed_bucket_id"], title="")) 
        logger.info(f"Moved task {task['id']} to completed bucket {project['completed_bucket_id']}.")
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")

async def handle_pr_opened(payload: dict):
    pr = payload.get("pull_request", {})
    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")

    if not repo_url or not branch_name:
        return

    project = find_project_by_repo_url(repo_url)
    if not project or not project.get("in_review_bucket_id"):
        return

    task = find_task_by_branch(project["id"], branch_name)
    if not task:
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=project["in_review_bucket_id"], title=""))
        logger.info(f"Moved task {task['id']} to in-review bucket {project['in_review_bucket_id']}.")
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")

async def handle_pr_review_submitted(payload: dict):
    review = payload.get("review", {})
    state = review.get("state")
    
    # Move back to Todo if changes requested or just commented
    if state not in ["changes_requested", "commented"]:
        return

    pr = payload.get("pull_request", {})
    repo_url = payload.get("repository", {}).get("html_url")
    branch_name = pr.get("head", {}).get("ref")

    if not repo_url or not branch_name:
        return

    project = find_project_by_repo_url(repo_url)
    if not project or not project.get("todo_bucket_id"):
        return

    task = find_task_by_branch(project["id"], branch_name)
    if not task:
        return

    try:
        db_update_task(task["id"], DatabaseTask(bucket_id=project["todo_bucket_id"], title=""))
        logger.info(f"Moved task {task['id']} to todo bucket {project['todo_bucket_id']}.")
    except Exception as e:
        logger.error(f"Failed to move task {task['id']}: {e}")
