from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

RolloverType = Literal["reset", "rollover", "capped"]


class CategoryLibraryCreate(BaseModel):
    name: str
    icon: str | None = None


class CategoryLibraryItem(BaseModel):
    id: str
    name: str
    icon: str | None = None


class CategoryCreate(BaseModel):
    name: str
    planned_amount: Decimal = Decimal("0.00")
    rollover_type: RolloverType = "reset"
    rollover_cap: Decimal | None = None
    icon: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    planned_amount: Decimal | None = None
    rollover_type: RolloverType | None = None
    rollover_cap: Decimal | None = None


class CategoryResponse(BaseModel):
    """Shape expected by the frontend's `Category` type (client/src/types/index.ts)."""

    id: str
    name: str
    type: Literal["expense", "income"] = "expense"
    planned: Decimal
    spent: Decimal
    rolloverType: RolloverType
    rolloverCap: Decimal | None = None


class MoveFundsRequest(BaseModel):
    from_category_id: str
    to_category_id: str
    amount: Decimal
    note: str | None = None
