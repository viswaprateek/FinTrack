import datetime as dt
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

RecurringFrequency = Literal["weekly", "monthly", "quarterly", "yearly"]
RecurringStatus = Literal["active", "paused"]


class RecurringRuleCreate(BaseModel):
    name: str
    amount: Decimal
    frequency: RecurringFrequency
    next_due: dt.date
    category_id: str | None = None


class RecurringRuleUpdate(BaseModel):
    name: str | None = None
    amount: Decimal | None = None
    frequency: RecurringFrequency | None = None
    next_due: dt.date | None = None
    category_id: str | None = None
    status: RecurringStatus | None = None


class RecurringRuleResponse(BaseModel):
    """Shape expected by the frontend's `RecurringRule` type (client/src/types/index.ts)."""

    id: str
    name: str
    amount: Decimal
    frequency: RecurringFrequency
    nextDue: str
    category: str
    status: RecurringStatus


class PostRecurringRuleRequest(BaseModel):
    """Posts a due recurring rule into a real transaction on the given budget."""

    budget_id: str
    date: dt.date | None = None


class UpcomingBillResponse(BaseModel):
    """Shape expected by the frontend's `UpcomingBill` type — derived from recurring rules."""

    id: str
    name: str
    dueDate: str
    amount: Decimal
    category: str
