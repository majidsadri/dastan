"""Supabase JWT verification using JWKS (ES256)."""
import logging
from typing import Optional

import jwt as pyjwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# JWKS client caches keys automatically
_jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwks_client = PyJWKClient(_jwks_url) if settings.SUPABASE_URL else None


def _decode_supabase_token(token: str) -> dict:
    """Decode and verify a Supabase access token using JWKS."""
    if not _jwks_client:
        raise Exception("SUPABASE_URL not configured")
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return pyjwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256"],
        audience="authenticated",
    )


async def get_jwt_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Returns full decoded JWT payload if valid, None otherwise."""
    if not credentials:
        return None
    try:
        return _decode_supabase_token(credentials.credentials)
    except Exception as e:
        logger.debug(f"Token verification failed: {e}")
        return None


async def get_current_user_id(
    payload: Optional[dict] = Depends(get_jwt_payload),
) -> Optional[str]:
    """Returns user UUID if a valid Supabase token is provided, None otherwise."""
    if not payload:
        return None
    return payload.get("sub")


async def require_user_id(
    user_id: Optional[str] = Depends(get_current_user_id),
) -> str:
    """Require a valid Supabase user — raises 401 if not authenticated."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id
