import datetime as dt
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

ReimbursementStatus = Literal["none", "pending", "received"]
TransactionType = Literal["expense", "income"]


class TransactionSplitInput(BaseModel):
    category_id: str | None = None
    amount: Decimal
    notes: str | None = None


class TransactionCreate(BaseModel):
    budget_id: str
    category_id: str | None = None
    date: dt.date
    description: str
    amount: Decimal
    type: TransactionType = "expense"
    account: str | None = None
    reimbursable: ReimbursementStatus = "none"
    notes: str | None = None
    splits: list[TransactionSplitInput] | None = None
    source: Literal["manual", "assistant"] = "manual"


class TransactionUpdate(BaseModel):
    category_id: str | None = None
    date: dt.date | None = None
    description: str | None = None
    amount: Decimal | None = None
    type: TransactionType | None = None
    account: str | None = None
    reimbursable: ReimbursementStatus | None = None
    reimbursed_amount: Decimal | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    """Shape expected by the frontend's `Transaction` type (client/src/types/index.ts).
    `amount` is signed: negative for expenses, positive for income."""

    id: str
    date: str
    description: str
    category: str
    account: str
    amount: Decimal
    reimbursable: ReimbursementStatus
    isSplit: bool
    notes: str | None = None
