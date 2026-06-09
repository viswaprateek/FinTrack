from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.config import settings
from app.schemas.expense_share import PublicOweResponse
from app.services.deps import get_expense_share_service
from app.services.expense_share_service import ExpenseShareService

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/owe/{token}", response_model=PublicOweResponse)
def view_owe(
    token: str,
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    return service.get_public_owe(token)


@router.post("/internal/reminders/expense-shares")
def run_expense_share_reminders(
    x_cron_secret: str | None = Header(default=None),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    secret = settings.CRON_SECRET
    if not secret or x_cron_secret != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
    sent = service.process_reminders()
    return {"sent": sent}
