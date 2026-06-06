from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)

RecurringFrequency = SAEnum("weekly", "monthly", "quarterly", "yearly", name="recurring_frequency")


class RecurringRule(Base, TimestampMixin):
    """A recurring bill/subscription. `next_due` advances each time it's posted
    into a transaction; `is_active` toggles the paused/active UI state."""

    __tablename__ = "recurring_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    frequency: Mapped[str] = mapped_column(RecurringFrequency, nullable=False)
    next_due: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")

    user: Mapped["User"] = relationship(back_populates="recurring_rules")
    category: Mapped["Category | None"] = relationship()
