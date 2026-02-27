import hashlib
import hmac
from github import Auth, Github, GithubIntegration
from config import settings


def get_github_integration() -> GithubIntegration:
    auth = Auth.AppAuth(
        app_id=settings.gh_app_id,
        private_key=settings.gh_app_private_key,
    )
    return GithubIntegration(auth=auth)


def get_github_client(installation_id: int | None = None) -> Github:
    iid = installation_id or settings.gh_app_installation_id
    if iid is None:
        raise ValueError("No installation_id provided and GITHUB_APP_INSTALLATION_ID is not set.")
    
    gi = get_github_integration()
    installation = gi.get_installation(iid)
    return installation.get_github_for_installation()


def verify_webhook_signature(payload: bytes, signature_header: str | None) -> bool:
    if not signature_header:
        return False
    
    expected = "sha256=" + hmac.new(
        settings.gh_webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature_header)