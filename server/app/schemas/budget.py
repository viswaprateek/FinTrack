from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class BudgetCreate(BaseModel):
    name: str
    period_start: date
    period_end: date
    copy_from_budget_id: str | None = None


class BudgetUpdate(BaseModel):
    name: str | None = None
    period_start: date | None = None
    period_end: date | None = None
    is_archived: bool | None = None


class BudgetResponse(BaseModel):
    """Shape expected by the frontend's `Budget` type (client/src/types/index.ts)."""

    id: str
    name: str
    period: str
    periodStart: date
    periodEnd: date
    plannedTotal: Decimal
    spentTotal: Decimal
