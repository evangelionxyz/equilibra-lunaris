import json
import httpx
import logging
from fastapi import APIRouter, Request, HTTPException, Header, BackgroundTasks, Depends
from routers.auth import get_current_user
from github_app import get_github_client, get_github_integration, verify_webhook_signature
from services.pr_evaluator import process_pr_evaluation
from services.webhook_handlers import handle_pr_closed, handle_pr_opened

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


async def verify_signature(
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
) -> dict:
    if not x_hub_signature_256:
        raise HTTPException(status_code=401, detail="Missing signature")
    
    raw_body = await request.body()
    expected = "sha256=" + __import__("hmac").new(
        __import__("config").settings.gh_webhook_secret.encode(),
        raw_body,
        __import__("hashlib").sha256,
    ).hexdigest()

    if not __import__("hmac").compare_digest(expected, x_hub_signature_256):
        logger.warning("Invalid webhook signature detected.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        return __import__("json").loads(raw_body)
    except __import__("json").JSONDecodeError:
        logger.error("Invalid JSON payload received.")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

@router.post("/github/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    payload: dict = Depends(verify_signature),
    x_github_event: str | None = Header(default=None),
):
    """
    Receive and verify GitHub webhook payloads.
    Only processes events whose signature matches the webhook secret.
    """
    event = x_github_event or "unknown"
    
    from services.webhook_handlers import process_github_event
    background_tasks.add_task(process_github_event, payload, event)
    
    return {"status": "accepted"}

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