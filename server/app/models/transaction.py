from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)

TransactionType = SAEnum("expense", "income", name="transaction_type")
ReimbursementStatus = SAEnum("none", "pending", "received", name="reimbursement_status")


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    type: Mapped[str] = mapped_column(TransactionType, default="expense", server_default="expense")
    account: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_split: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    reimbursement_status: Mapped[str] = mapped_column(ReimbursementStatus, default="none", server_default="none")
    reimbursed_amount: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"), server_default="0.00")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    budget: Mapped["Budget"] = relationship(back_populates="transactions")
    category: Mapped["Category | None"] = relationship()
    splits: Mapped[list["TransactionSplit"]] = relationship(
        back_populates="transaction", cascade="all, delete-orphan"
    )
    expense_share: Mapped["ExpenseShare | None"] = relationship(
        back_populates="transaction", cascade="all, delete-orphan", uselist=False
    )


class TransactionSplit(Base):
    __tablename__ = "transaction_splits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    transaction: Mapped["Transaction"] = relationship(back_populates="splits")
    category: Mapped["Category | None"] = relationship()
