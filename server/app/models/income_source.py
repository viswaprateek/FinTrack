from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)

IncomeSchedule = SAEnum("weekly", "biweekly", "semimonthly", "monthly", "custom", name="income_schedule")


class IncomeSource(Base, TimestampMixin):
    __tablename__ = "income_sources"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    schedule: Mapped[str] = mapped_column(IncomeSchedule, default="monthly", server_default="monthly")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    budget: Mapped["Budget"] = relationship(back_populates="income_sources")
