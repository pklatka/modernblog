"""Shared dependencies for ModernBlog backend."""

from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import get_settings
from .security import verify_access_token

security = HTTPBearer(auto_error=False)


def verify_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """Verify admin token for protected endpoints."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = credentials.credentials
    settings = get_settings()

    payload = verify_access_token(token, settings.SECRET_KEY)
    if not payload or payload.get("sub") != "admin":
        raise HTTPException(status_code=401, detail="Invalid token")

    return True


def is_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> bool:
    """Check if admin is authenticated without raising exception."""
    if not credentials:
        return False

    token = credentials.credentials
    settings = get_settings()

    payload = verify_access_token(token, settings.SECRET_KEY)
    if not payload or payload.get("sub") != "admin":
        return False

    return True
