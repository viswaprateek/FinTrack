import datetime as dt
from decimal import Decimal

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    name: str
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0)
    icon: str | None = None
    target_date: dt.date | None = None
    notes: str | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: Decimal | None = Field(default=None, gt=0)
    icon: str | None = None
    target_date: dt.date | None = None
    notes: str | None = None
    is_archived: bool | None = None


class GoalResponse(BaseModel):
    """Shape expected by the frontend's `Goal` type (client/src/types/index.ts)."""

    id: str
    name: str
    icon: str | None = None
    targetAmount: Decimal
    currentAmount: Decimal
    targetDate: str | None = None
    notes: str | None = None
    percentComplete: float
    remainingAmount: Decimal
    isComplete: bool
    isArchived: bool


class GoalContributionCreate(BaseModel):
    amount: Decimal
    note: str | None = None
    contributed_at: dt.datetime | None = None


class GoalContributionResponse(BaseModel):
    """Shape expected by the frontend's `GoalContribution` type."""

    id: str
    goalId: str
    amount: Decimal
    note: str | None = None
    contributedAt: str
