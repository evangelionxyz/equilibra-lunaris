import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from config import settings
from services.database.users import DatabaseUser, get_or_create_user
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/auth", tags=["Auth"])

_pending_oauth_states: set[str] = set()

_bearer = HTTPBearer(auto_error=False)

AUTH_COOKIE = "gh_token"

class AuthMeResponse(BaseModel):
    id: int | None = None
    login: str | None = None
    name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    html_url: str | None = None
    public_repos: int | None = None
    followers: int | None = None
    db_user: DatabaseUser | None = None
    
http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(15.0, connect=5.0), 
    limits=httpx.Limits(max_connections=100)
)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """
    Dependency: resolves the GitHub access token from either:
      1. Authorization: Bearer <token> header  (API / mobile clients)
      2. gh_token HTTP-only cookie             (browser clients)
    Raises 401 if no token is present or the token is rejected by GitHub.
    """
    token: str | None = None

    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get(AUTH_COOKIE)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    async with httpx.AsyncClient() as http:
        resp = await http.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    return resp.json()


@router.get("/login")
def auth_login():
    """
    Redirect the browser to GitHub's OAuth authorization page.
    A random state token is generated to prevent CSRF.
    """
    state = secrets.token_urlsafe(32)
    _pending_oauth_states.add(state)
    qs = urlencode({
        "client_id": settings.gh_app_client_id,
        "redirect_uri": settings.gh_oauth_redirect_uri,
        "state": state,
    })
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{qs}")

@router.get("/callback")
async def auth_callback(code: str, state: str):
    """
    Handle the GitHub OAuth callback.
    Validates the state token, exchanges the code for an access token,
    and returns basic user information.
    """
    if state not in _pending_oauth_states:
        raise HTTPException(status_code=400, detail="Invalid or expired state parameter")
    _pending_oauth_states.discard(state)

    client_id = settings.gh_app_client_id
    client_secret = settings.gh_app_client_secret
    redirect_uri = settings.gh_oauth_redirect_uri


    # Exchange authorization code for access token
    async with httpx.AsyncClient() as http:
        token_resp = await http.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="GitHub token exchange failed")

    token_data = token_resp.json()
    if "error" in token_data:
        raise HTTPException(
            status_code=400,
            detail=token_data.get("error_description", token_data["error"]),
        )

    access_token = token_data["access_token"]

    # Fetch the authenticated user's profile
    async with httpx.AsyncClient() as http:
        user_resp = await http.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=10,
        )

    user = user_resp.json() if user_resp.status_code == 200 else {}

    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key=AUTH_COOKIE,
        value=access_token,
        httponly=True,
        secure=False,   # set True in production (HTTPS only)
        samesite="lax",
        max_age=28800,  # 8 hours
    )
    return response

@router.get("/me", response_model=AuthMeResponse)
async def auth_me(current_user: dict = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated GitHub user.
    Requires: Authorization: Bearer <access_token>
    """
    return {
        "id": current_user.get("id"),
        "login": current_user.get("login"),
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "avatar_url": current_user.get("avatar_url"),
        "html_url": current_user.get("html_url"),
        "public_repos": current_user.get("public_repos"),
        "followers": current_user.get("followers"),
        "db_user": None,
    }

@router.post("/sync-user", response_model=DatabaseUser | None)
async def sync_logged_in_user(current_user: dict = Depends(get_current_user)):
    """
    Create or fetch a database user for the currently authenticated GitHub user.
    Call this from frontend after login succeeds.
    """
    return await run_in_threadpool(
        get_or_create_user,
        int(current_user.get("id", 0) or 0),
        current_user.get("email"),
        current_user.get("login"),
        current_user.get("name"),
    )

@router.post("/logout")
async def auth_logout():
    """
    Clear the auth cookie, effectively signing the user out.
    The frontend redirects to the login page after calling this endpoint.
    """
    response = JSONResponse({"logged_out": True})
    response.delete_cookie(key=AUTH_COOKIE, httponly=True, samesite="lax")
    return response
