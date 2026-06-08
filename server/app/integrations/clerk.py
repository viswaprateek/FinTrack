import json
import logging
import ssl
import urllib.error
import urllib.request

import certifi

from app.core.config import settings

logger = logging.getLogger(__name__)

_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def fetch_clerk_user(clerk_user_id: str) -> dict | None:
    """Load profile fields from the Clerk Backend API (GET /v1/users/{user_id})."""
    if not settings.CLERK_SECRET_KEY:
        return None

    request = urllib.request.Request(
        f"https://api.clerk.com/v1/users/{clerk_user_id}",
        headers={
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
            "Accept": "application/json",
            # Default urllib User-Agent is blocked by Cloudflare in front of api.clerk.com.
            "User-Agent": "FinTrack/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10, context=_SSL_CONTEXT) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:300]
        if exc.code == 401:
            logger.error(
                "Clerk API rejected CLERK_SECRET_KEY (401). "
                "Copy a fresh secret key from Clerk Dashboard → API Keys for this instance."
            )
        else:
            logger.warning(
                "Clerk API returned %s for user %s: %s",
                exc.code,
                clerk_user_id,
                body,
            )
        return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        logger.warning("Failed to fetch Clerk user %s: %s", clerk_user_id, exc)
        return None


def primary_email_from_clerk_user(clerk_user: dict) -> str | None:
    primary_id = clerk_user.get("primary_email_address_id")
    for address in clerk_user.get("email_addresses", []):
        if address.get("id") == primary_id:
            return address.get("email_address")

    addresses = clerk_user.get("email_addresses", [])
    if addresses:
        return addresses[0].get("email_address")

    return None
