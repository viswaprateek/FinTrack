import ssl
from functools import lru_cache

import certifi
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _jwks_client() -> PyJWKClient:
    # Use certifi's CA bundle explicitly: macOS python.org builds ship without a
    # populated system cert store, which makes the JWKS HTTPS fetch fail with
    # CERTIFICATE_VERIFY_FAILED.
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    # PyJWKClient caches keys internally and refreshes on signing-key-not-found.
    return PyJWKClient(settings.CLERK_JWKS_URL, ssl_context=ssl_context)


def _decode_clerk_token(token: str) -> dict:
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired session token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Send `Authorization: Bearer <Clerk session token>`.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = _decode_clerk_token(credentials.credentials)
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing a `sub` claim.")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        # First time we've seen this Clerk user — provision a local record. Default Clerk
        # session tokens only carry `sub`; configure custom session claims (email, first_name,
        # last_name) in the Clerk dashboard so they land here on first login.
        user = User(
            clerk_user_id=clerk_user_id,
            email=claims.get("email", ""),
            first_name=claims.get("first_name"),
            last_name=claims.get("last_name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
