import json
import httpx
import logging
from fastapi import APIRouter, Request, HTTPException, Header, BackgroundTasks, Depends
from routers.auth import get_current_user
from github_app import get_github_client, get_github_integration, verify_webhook_signature
from services.pr_evaluator import process_pr_evaluation

router = APIRouter(tags=["GitHub App"])
logger = logging.getLogger("uvicorn.error")


@router.get("/github/app")
def get_app_info():
    gi = get_github_integration()
    app_info = gi.get_app()
    return {
        "id": app_info.id,
        "name": app_info.name,
        "description": app_info.description,
        "html_url": app_info.html_url,
    }


@router.get("/github/repos")
def list_repos(installation_id: int | None = None):
    try:
        gh = get_github_client(installation_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    repos = [
        {"full_name": r.full_name, "private": r.private, "url": r.html_url}
        for r in gh.get_repos()
    ]
    return {"repos": repos}


@router.post("/github/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str | None = Header(default=None),
    x_github_event: str | None = Header(default=None),
):
    """
    Receive and verify GitHub webhook payloads.
    Only processes events whose signature matches the webhook secret.
    """
    raw_body = await request.body()

    if not verify_webhook_signature(raw_body, x_hub_signature_256):
        logger.warning("Invalid webhook signature detected.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        logger.error("Invalid JSON payload received.")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = x_github_event or "unknown"
    action = payload.get("action", "")

    # ------------------------------------------------------------------
    # THE EVENT DISPATCHER
    # ------------------------------------------------------------------
    if event == "pull_request":
        if action in ["opened", "reopened", "synchronize"]:
            pr_number = payload.get("pull_request", {}).get("number")
            repo_full_name = payload.get("repository", {}).get("full_name")
            installation_id = payload.get("installation", {}).get("id")

            if not all([pr_number, repo_full_name, installation_id]):
                logger.error("Webhook payload missing required PR metadata.")
                return {"handled": False, "reason": "Missing metadata"}

            background_tasks.add_task(
                process_pr_evaluation, 
                repo_full_name, 
                pr_number, 
                installation_id
            )
            logger.info(f"Queued PR #{pr_number} on {repo_full_name} for AI evaluation.")
            return {"handled": True, "event": event, "action": action, "pr": pr_number, "status": "queued"}
            
        return {"handled": True, "event": event, "action": action, "status": "ignored_action"}

    if event == "push":
        ref = payload.get("ref", "")
        repo = payload.get("repository", {}).get("full_name", "")
        return {"handled": True, "event": event, "ref": ref, "repo": repo}

    if event == "issues":
        issue_number = payload.get("issue", {}).get("number")
        return {"handled": True, "event": event, "action": action, "issue": issue_number}

    return {"handled": False, "event": event, "action": action}

@router.get("/github/users/search")
async def search_github_users(query: str, current_user: dict = Depends(get_current_user)):
    del current_user
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        return {"items": []}

    async with httpx.AsyncClient(timeout=10.0) as http:
        response = await http.get(
            "https://api.github.com/search/users",
            params={"q": f"{normalized_query} in:login", "per_page": 8},
            headers={"Accept": "application/vnd.github+json"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to query GitHub usernames")

    payload = response.json()
    items = payload.get("items", [])
    return {
        "items": [
            {
                "login": item.get("login"),
                "avatar_url": item.get("avatar_url"),
                "html_url": item.get("html_url"),
            }
            for item in items
        ]
    }