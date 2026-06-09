from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.expense_share import (
    ExpenseShareParticipantUpdate,
    ExpenseShareResponse,
    ExpenseShareUpdate,
)
from app.services.deps import get_expense_share_service
from app.services.expense_share_service import ExpenseShareService

router = APIRouter(prefix="/expense-shares", tags=["expense-shares"])


@router.get("", response_model=list[ExpenseShareResponse])
def list_expense_shares(
    current_user: User = Depends(get_current_user),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    return service.list_for_user(current_user)


@router.get("/outstanding-total")
def outstanding_total(
    current_user: User = Depends(get_current_user),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    total = service.outstanding_total(current_user)
    return {"total": total}


@router.patch("/participants/{participant_id}", response_model=ExpenseShareResponse)
def update_participant(
    participant_id: str,
    payload: ExpenseShareParticipantUpdate,
    current_user: User = Depends(get_current_user),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    return service.update_participant(current_user, participant_id, payload)


@router.get("/{share_id}", response_model=ExpenseShareResponse)
def get_expense_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    return service.get_share(current_user, share_id)


@router.patch("/{share_id}", response_model=ExpenseShareResponse)
def update_expense_share(
    share_id: str,
    payload: ExpenseShareUpdate,
    current_user: User = Depends(get_current_user),
    service: ExpenseShareService = Depends(get_expense_share_service),
):
    return service.update_share(current_user, share_id, payload)
