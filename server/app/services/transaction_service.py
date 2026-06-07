from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import UNCATEGORIZED
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.utils import parse_id
from app.models.audit_log import AuditLog
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionSplit
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService


class TransactionService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)
        self.categories = CategoryService(db)

    def _signed_amount(self, transaction: Transaction) -> Decimal:
        return -transaction.amount if transaction.type == "expense" else transaction.amount

    def _to_response(self, transaction: Transaction) -> TransactionResponse:
        return TransactionResponse(
            id=str(transaction.id),
            date=transaction.date.isoformat(),
            description=transaction.description,
            category=transaction.category.name if transaction.category else UNCATEGORIZED,
            account=transaction.account or "",
            amount=self._signed_amount(transaction),
            reimbursable=transaction.reimbursement_status,
            isSplit=transaction.is_split,
            notes=transaction.notes,
        )

    def _get_owned_transaction(self, user: User, transaction_id_raw: str) -> Transaction:
        transaction_id = parse_id(transaction_id_raw, label="transaction id")
        transaction = self.db.scalar(
            select(Transaction)
            .where(Transaction.id == transaction_id)
            .options(selectinload(Transaction.category), selectinload(Transaction.splits))
        )
        if transaction is None or transaction.budget.user_id != user.id:
            raise NotFoundError("Transaction")
        return transaction

    def list_transactions(
        self,
        user: User,
        *,
        budget_id: str | None = None,
        category: str | None = None,
        type: str | None = None,
        reimbursable: str | None = None,
        search: str | None = None,
    ) -> list[TransactionResponse]:
        stmt = (
            select(Transaction)
            .join(Budget, Transaction.budget_id == Budget.id)
            .where(Budget.user_id == user.id)
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

        transactions = self.db.scalars(stmt).all()
        return [self._to_response(t) for t in transactions]

    def create_transaction(self, user: User, payload: TransactionCreate) -> TransactionResponse:
        budget = self.budgets.get_owned_budget(user, payload.budget_id)
        category = (
            self.categories.get_owned_category(user, payload.category_id)
            if payload.category_id
            else None
        )

        splits = payload.splits or []
        if splits and sum(s.amount for s in splits) != payload.amount:
            raise BadRequestError("Split amounts must sum to the transaction amount")

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
        self.db.add(transaction)
        self.db.flush()

        for split in splits:
            split_category = (
                self.categories.get_owned_category(user, split.category_id)
                if split.category_id
                else None
            )
            self.db.add(
                TransactionSplit(
                    transaction_id=transaction.id,
                    category_id=split_category.id if split_category else None,
                    amount=split.amount,
                    notes=split.notes,
                )
            )

        if payload.source == "assistant":
            self.db.add(
                AuditLog(
                    user_id=user.id,
                    entity_type="transaction_created",
                    entity_id=transaction.id,
                    description=(
                        f"Transaction added via AI assistant: {transaction.description} "
                        f"₹{transaction.amount}"
                    ),
                )
            )

        self.db.commit()
        return self._to_response(self._get_owned_transaction(user, str(transaction.id)))

    def update_transaction(
        self, user: User, transaction_id: str, payload: TransactionUpdate
    ) -> TransactionResponse:
        transaction = self._get_owned_transaction(user, transaction_id)
        data = payload.model_dump(exclude_unset=True)

        if "category_id" in data:
            raw = data.pop("category_id")
            transaction.category_id = (
                self.categories.get_owned_category(user, raw).id if raw else None
            )
        if "reimbursable" in data:
            transaction.reimbursement_status = data.pop("reimbursable")

        for field, value in data.items():
            setattr(transaction, field, value)

        self.db.commit()
        return self._to_response(self._get_owned_transaction(user, transaction_id))

    def delete_transaction(self, user: User, transaction_id: str) -> None:
        transaction = self._get_owned_transaction(user, transaction_id)
        self.db.delete(transaction)
        self.db.commit()
