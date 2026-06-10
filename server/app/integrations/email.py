import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(*, to: str, subject: str, html: str, text: str) -> bool:
    """Send email via Resend when configured; otherwise log in development."""
    api_key = settings.RESEND_API_KEY
    from_addr = settings.EMAIL_FROM

    if not api_key or not from_addr:
        logger.info("Email (dev log) to=%s subject=%s\n%s", to, subject, text)
        return True

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"from": from_addr, "to": [to], "subject": subject, "html": html, "text": text},
            timeout=15.0,
        )
        response.raise_for_status()
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False
