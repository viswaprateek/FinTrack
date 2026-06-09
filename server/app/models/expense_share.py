import secrets
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)

ReminderFrequency = SAEnum("off", "weekly", "monthly", name="expense_share_reminder_frequency")
ParticipantStatus = SAEnum("pending", "paid", name="expense_share_participant_status")


def _view_token() -> str:
    return secrets.token_urlsafe(32)


class ExpenseShare(Base, TimestampMixin):
    __tablename__ = "expense_shares"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    created_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reminder_frequency: Mapped[str] = mapped_column(
        ReminderFrequency, default="off", server_default="off"
    )

    transaction: Mapped["Transaction"] = relationship(back_populates="expense_share")
    created_by: Mapped["User"] = relationship()
    participants: Mapped[list["ExpenseShareParticipant"]] = relationship(
        back_populates="expense_share", cascade="all, delete-orphan"
    )


class ExpenseShareParticipant(Base):
    __tablename__ = "expense_share_participants"
    __table_args__ = (UniqueConstraint("view_token", name="uq_expense_share_participant_view_token"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    expense_share_id: Mapped[int] = mapped_column(
        ForeignKey("expense_shares.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    linked_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    amount_owed: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    status: Mapped[str] = mapped_column(ParticipantStatus, default="pending", server_default="pending")
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_reminded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    view_token: Mapped[str] = mapped_column(String(64), default=_view_token, nullable=False)

    expense_share: Mapped["ExpenseShare"] = relationship(back_populates="participants")
    linked_user: Mapped["User | None"] = relationship(foreign_keys=[linked_user_id])
