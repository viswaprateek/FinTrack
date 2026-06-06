from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.v1.routers._helpers import not_found, parse_id
from app.api.v1.routers.budgets import _get_owned_budget
from app.api.v1.routers.categories import _get_owned_category
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionSplit
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])

UNCATEGORIZED = "Uncategorized"


def _signed_amount(transaction: Transaction) -> Decimal:
    return -transaction.amount if transaction.type == "expense" else transaction.amount


def _to_response(transaction: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=str(transaction.id),
        date=transaction.date.isoformat(),
        description=transaction.description,
        category=transaction.category.name if transaction.category else UNCATEGORIZED,
        account=transaction.account or "",
        amount=_signed_amount(transaction),
        reimbursable=transaction.reimbursement_status,
        isSplit=transaction.is_split,
        notes=transaction.notes,
    )


def _get_owned_transaction(db: Session, user: User, transaction_id_raw: str) -> Transaction:
    transaction_id = parse_id(transaction_id_raw, label="transaction id")
    transaction = db.scalar(
        select(Transaction)
        .where(Transaction.id == transaction_id)
        .options(selectinload(Transaction.category), selectinload(Transaction.splits))
    )
    if transaction is None or transaction.budget.user_id != user.id:
        raise not_found("Transaction")
    return transaction


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    budget_id: str | None = Query(default=None),
    category: str | None = Query(default=None, description="Filter by category name"),
    type: str | None = Query(default=None, pattern="^(expense|income)$"),
    reimbursable: str | None = Query(default=None, pattern="^(none|pending|received)$"),
    search: str | None = Query(default=None, description="Matches against description"),
):
    stmt = (
        select(Transaction)
        .join(Budget, Transaction.budget_id == Budget.id)
        .where(Budget.user_id == current_user.id)
        .options(selectinload(Transaction.category), selectinload(Transaction.splits))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
    )
    if budget_id is not None:
        stmt = stmt.where(Transaction.budget_id == parse_id(budget_id, label="budget id"))
    if type is not None:
        stmt = stmt.where(Transaction.type == type)
    if reimbursable is not None:
        stmt = stmt.where(Transaction.reimbursement_status == reimbursable)
    if search:
        stmt = stmt.where(Transaction.description.ilike(f"%{search}%"))
    if category:
        stmt = stmt.where(Transaction.category.has(Category.name == category))

    transactions = db.scalars(stmt).all()
    return [_to_response(t) for t in transactions]


@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, payload.budget_id)
    category = (
        _get_owned_category(db, current_user, payload.category_id) if payload.category_id else None
    )

    splits = payload.splits or []
    if splits and sum(s.amount for s in splits) != payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Split amounts must sum to the transaction amount",
        )

    transaction = Transaction(
        budget_id=budget.id,
        category_id=category.id if category else None,
        date=payload.date,
        description=payload.description,
        amount=payload.amount,
        type=payload.type,
        account=payload.account,
        reimbursement_status=payload.reimbursable,
        notes=payload.notes,
        is_split=bool(splits),
    )
    db.add(transaction)
    db.flush()

    for split in splits:
        split_category = (
            _get_owned_category(db, current_user, split.category_id) if split.category_id else None
        )
        db.add(
            TransactionSplit(
                transaction_id=transaction.id,
                category_id=split_category.id if split_category else None,
                amount=split.amount,
                notes=split.notes,
            )
        )

    if payload.source == "assistant":
        db.add(
            AuditLog(
                user_id=current_user.id,
                entity_type="transaction_created",
                entity_id=transaction.id,
                description=f"Transaction added via AI assistant: {transaction.description} ₹{transaction.amount}",
            )
        )

    db.commit()
    return _to_response(_get_owned_transaction(db, current_user, str(transaction.id)))


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = _get_owned_transaction(db, current_user, transaction_id)
    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data:
        raw = data.pop("category_id")
        transaction.category_id = (
            _get_owned_category(db, current_user, raw).id if raw else None
        )
    if "reimbursable" in data:
        transaction.reimbursement_status = data.pop("reimbursable")

    for field, value in data.items():
        setattr(transaction, field, value)

    db.commit()
    return _to_response(_get_owned_transaction(db, current_user, transaction_id))


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = _get_owned_transaction(db, current_user, transaction_id)
    db.delete(transaction)
    db.commit()
