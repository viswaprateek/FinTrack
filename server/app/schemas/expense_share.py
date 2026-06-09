from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_validator

ReminderFrequency = Literal["off", "weekly", "monthly"]
ParticipantStatus = Literal["pending", "paid"]


class FriendSplitInput(BaseModel):
    email: str
    amount: Decimal

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email:
            raise ValueError("Invalid email address")
        return email


class ExpenseShareParticipantResponse(BaseModel):
    id: str
    email: str
    amountOwed: Decimal
    status: ParticipantStatus
    paidAt: str | None = None
    lastRemindedAt: str | None = None


class ExpenseShareResponse(BaseModel):
    id: str
    transactionId: str
    description: str
    transactionDate: str
    totalAmount: Decimal
    yourShare: Decimal
    reminderFrequency: ReminderFrequency
    participants: list[ExpenseShareParticipantResponse]


class ExpenseShareParticipantUpdate(BaseModel):
    status: ParticipantStatus | None = None


class ExpenseShareUpdate(BaseModel):
    reminder_frequency: ReminderFrequency | None = None


class PublicOweResponse(BaseModel):
    payerName: str
    description: str
    date: str
    amountOwed: Decimal
    currency: str
    status: ParticipantStatus


class OwedExpenseResponse(BaseModel):
    """Expense share where the current user is a participant (owes the payer)."""

    participantId: str
    shareId: str
    payerName: str
    payerEmail: str
    description: str
    transactionDate: str
    amountOwed: Decimal
    status: ParticipantStatus
    paidAt: str | None = None


class ParticipantUpdateResult(BaseModel):
    participantId: str
    shareId: str
    status: ParticipantStatus
    paidAt: str | None = None
