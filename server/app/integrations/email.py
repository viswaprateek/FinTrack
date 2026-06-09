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


def expense_share_invite_email(
    *,
    to: str,
    payer_name: str,
    description: str,
    amount: str,
    owe_url: str,
    is_reminder: bool = False,
) -> bool:
    action = "Reminder" if is_reminder else "Payment request"
    subject = f"{action}: {amount} owed to {payer_name} for {description}"
    text = (
        f"Hi,\n\n"
        f"{payer_name} paid for \"{description}\" and your share is {amount}.\n\n"
        f"View details: {owe_url}\n\n"
        f"— FinTrack"
    )
    html = (
        f"<p>Hi,</p>"
        f"<p><strong>{payer_name}</strong> paid for <em>{description}</em> "
        f"and your share is <strong>{amount}</strong>.</p>"
        f'<p><a href="{owe_url}">View what you owe</a></p>'
        f"<p>— FinTrack</p>"
    )
    return send_email(to=to, subject=subject, html=html, text=text)
