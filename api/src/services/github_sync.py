import logging
import re
from github import Github, Auth
from services.database.database import _get_conn, _put_conn
import psycopg2.extras
from github_app import get_github_client

logger = logging.getLogger("uvicorn.error")

def slugify(text: str) -> str:
    """Strip special characters and replace spaces with hyphens."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def sync_task_to_github_branch(task_id: int, new_bucket_id: int):
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Look up the new_bucket_id in public.buckets and verify state == 'ONGOING'
        cur.execute("SELECT state FROM public.buckets WHERE id = %s LIMIT 1;", (new_bucket_id,))
        bucket_row = cur.fetchone()
        if not bucket_row or bucket_row["state"] != "ONGOING":
            return
            
        # 2. Look up the task. Verify type == 'CODE'. If branch_name exists, exit.
        cur.execute("SELECT id, project_id, lead_assignee_id, type, branch_name, title FROM public.tasks WHERE id = %s LIMIT 1;", (task_id,))
        task_row = cur.fetchone()
        if not task_row:
            return
            
        if task_row["type"] != "CODE":
            return
            
        if task_row["branch_name"]:
            return  # Branch already exists
            
        lead_assignee_id = task_row["lead_assignee_id"]
        # Allow falling back to Github App integration if we don't have lead assignee
        
        gh_access_token = None
        if lead_assignee_id:
            cur.execute("SELECT gh_access_token FROM public.users WHERE id = %s LIMIT 1;", (lead_assignee_id,))
            user_row = cur.fetchone()
            if user_row:
                gh_access_token = user_row["gh_access_token"]
        
        # 3. Fetch project's gh_repo_url
        cur.execute("SELECT gh_repo_url FROM public.projects WHERE id = %s LIMIT 1;", (task_row["project_id"],))
        project_row = cur.fetchone()
        if not project_row or not project_row.get("gh_repo_url"):
            logger.warning(f"Project for task {task_id} has no gh_repo_url. Cannot sync to GitHub.")
            return
            
        # Assume first URL in the array
        repo_url = project_row["gh_repo_url"][0]
        match = re.search(r"github\.com/([^/]+/[^/]+?)(?:\.git)?/?$", repo_url)
        if not match:
            logger.warning(f"Invalid github repo url format: {repo_url}")
            return
        repo_full_name = match.group(1).rstrip('/')
        
        # 4. Create slugified title
        slugified_title = slugify(task_row["title"])
        # Avoid extremely long branch names
        slugified_title = slugified_title[:40]
        
        # 5. Branch format
        branch_name = f"feature/EQ-{task_id}-{slugified_title}"
        
        # Initialize Github client
        if gh_access_token:
            gh = Github(auth=Auth.Token(gh_access_token))
        else:
            logger.warning(f"No gh_access_token for assignee. Falling back to Github App bot integration.")
            from config import settings
            try:
                gh = get_github_client(settings.gh_app_installation_id)
            except Exception as e:
                logger.error(f"Cannot initialize GitHub App client. {e}")
                return
            
        try:
            repo = gh.get_repo(repo_full_name)
            default_branch = repo.default_branch
            main_ref = repo.get_git_ref(f"heads/{default_branch}")
            
            # Create branch
            repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main_ref.object.sha)
            logger.info(f"Successfully created branch {branch_name} for task {task_id}")
            
            # Update database
            cur.execute(
                "UPDATE public.tasks SET branch_name = %s, last_activity_at = NOW() WHERE id = %s;",
                (branch_name, task_id)
            )
            conn.commit()
            
        except Exception as e:
            logger.error(f"Failed to create github branch {branch_name} for task {task_id}: {e}")
            conn.rollback()
    
    except Exception as e:
        logger.error(f"Unhandled error in sync_task_to_github_branch: {e}")
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
