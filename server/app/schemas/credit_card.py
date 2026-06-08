import datetime as dt
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

CardBrand = Literal["visa", "mastercard", "amex", "paypal"]
CardTheme = Literal["lime", "yellow", "navy", "emerald", "violet"]


class CreditCardCreate(BaseModel):
    label: str
    cardholder_name: str
    last_four: str = Field(min_length=4, max_length=4, pattern=r"^\d{4}$")
    brand: CardBrand = "visa"
    theme: CardTheme = "lime"
    credit_limit: Decimal = Field(gt=0)
    current_balance: Decimal = Field(default=Decimal("0"), ge=0)
    expiry_month: int = Field(ge=1, le=12)
    expiry_year: int = Field(ge=2020, le=2099)


class CreditCardUpdate(BaseModel):
    label: str | None = None
    cardholder_name: str | None = None
    last_four: str | None = Field(default=None, min_length=4, max_length=4, pattern=r"^\d{4}$")
    brand: CardBrand | None = None
    theme: CardTheme | None = None
    credit_limit: Decimal | None = Field(default=None, gt=0)
    current_balance: Decimal | None = Field(default=None, ge=0)
    expiry_month: int | None = Field(default=None, ge=1, le=12)
    expiry_year: int | None = Field(default=None, ge=2020, le=2099)
    is_active: bool | None = None


class CreditCardResponse(BaseModel):
    id: str
    label: str
    cardholderName: str
    lastFour: str
    brand: CardBrand
    theme: CardTheme
    creditLimit: Decimal
    currentBalance: Decimal
    availableCredit: Decimal
    utilizationPercent: float
    expiryMonth: int
    expiryYear: int
    isActive: bool


class CardTransactionCreate(BaseModel):
    description: str
    amount: Decimal = Field(gt=0)
    category: str | None = None
    transacted_at: dt.datetime | None = None


class CardTransactionResponse(BaseModel):
    id: str
    cardId: str
    cardLabel: str
    description: str
    amount: Decimal
    category: str | None = None
    transactedAt: str
