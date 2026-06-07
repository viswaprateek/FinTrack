from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.deps import get_transaction_service
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
    budget_id: str | None = Query(default=None),
    category: str | None = Query(default=None, description="Filter by category name"),
    type: str | None = Query(default=None, pattern="^(expense|income)$"),
    reimbursable: str | None = Query(default=None, pattern="^(none|pending|received)$"),
    search: str | None = Query(default=None, description="Matches against description"),
):
    return service.list_transactions(
        current_user,
        budget_id=budget_id,
        category=category,
        type=type,
        reimbursable=reimbursable,
        search=search,
    )


@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    return service.create_transaction(current_user, payload)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    return service.update_transaction(current_user, transaction_id, payload)


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    service: TransactionService = Depends(get_transaction_service),
):
    service.delete_transaction(current_user, transaction_id)
