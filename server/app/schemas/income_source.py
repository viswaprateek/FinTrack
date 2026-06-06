from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

IncomeSchedule = Literal["weekly", "biweekly", "semimonthly", "monthly", "custom"]


class IncomeSourceCreate(BaseModel):
    name: str
    amount: Decimal
    schedule: IncomeSchedule = "monthly"
    notes: str | None = None


class IncomeSourceUpdate(BaseModel):
    name: str | None = None
    amount: Decimal | None = None
    schedule: IncomeSchedule | None = None
    notes: str | None = None


class IncomeSourceResponse(BaseModel):
    id: str
    name: str
    amount: Decimal
    schedule: IncomeSchedule
    notes: str | None = None
