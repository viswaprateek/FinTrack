import ssl
from functools import lru_cache

import certifi
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.integrations.clerk import fetch_clerk_user, primary_email_from_clerk_user
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


def _email_from_claim(value: object) -> str | None:
    if isinstance(value, str):
        return value or None
    if isinstance(value, dict):
        email = value.get("email_address")
        return email if isinstance(email, str) and email else None
    return None


def _profile_fields_from_claims(claims: dict) -> dict[str, str | None]:
    """Read profile fields from Clerk session JWT claims (supports common claim names)."""
    fields: dict[str, str | None] = {}

    for key in ("email", "primaryEmail", "primary_email"):
        if email := _email_from_claim(claims.get(key)):
            fields["email"] = email
            break

    for key in ("first_name", "firstName", "given_name"):
        if key in claims:
            fields["first_name"] = claims[key]
            break

    for key in ("last_name", "lastName", "family_name"):
        if key in claims:
            fields["last_name"] = claims[key]
            break

    return fields


def _apply_profile_fields(user: User, fields: dict[str, str | None]) -> bool:
    changed = False

    if email := fields.get("email"):
        if user.email != email:
            user.email = email
            changed = True

    if "first_name" in fields:
        first_name = fields["first_name"]
        if user.first_name != first_name:
            user.first_name = first_name
            changed = True

    if "last_name" in fields:
        last_name = fields["last_name"]
        if user.last_name != last_name:
            user.last_name = last_name
            changed = True

    return changed


def _sync_profile_from_claims(user: User, claims: dict) -> bool:
    return _apply_profile_fields(user, _profile_fields_from_claims(claims))


def _sync_profile_from_clerk_api(user: User, clerk_user_id: str) -> bool:
    clerk_user = fetch_clerk_user(clerk_user_id)
    if clerk_user is None:
        return False

    fields: dict[str, str | None] = {}
    if email := primary_email_from_clerk_user(clerk_user):
        fields["email"] = email
    if "first_name" in clerk_user:
        fields["first_name"] = clerk_user["first_name"]
    if "last_name" in clerk_user:
        fields["last_name"] = clerk_user["last_name"]

    return _apply_profile_fields(user, fields)


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
    is_new = user is None
    if is_new:
        user = User(clerk_user_id=clerk_user_id, email="")
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            # Parallel requests on first login can race to create the same user row.
            db.rollback()
            user = db.query(User).filter(User.clerk_user_id == clerk_user_id).one()
            is_new = False

    profile_changed = _sync_profile_from_claims(user, claims)

    # Clerk Backend API is slow (external HTTP). Only call when JWT lacks profile data.
    claims_fields = _profile_fields_from_claims(claims)
    needs_clerk_profile = (
        settings.CLERK_SECRET_KEY
        and (is_new or not user.email.strip() or not claims_fields.get("email"))
    )
    if needs_clerk_profile:
        profile_changed = _sync_profile_from_clerk_api(user, clerk_user_id) or profile_changed

    from app.services.expense_share_service import ExpenseShareService

    linked = 0
    if is_new or profile_changed:
        linked = ExpenseShareService(db).link_participants_for_user(user)

    if is_new or profile_changed or linked:
        db.commit()
        db.refresh(user)

    return user
