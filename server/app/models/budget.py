from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_budget_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")

    user: Mapped["User"] = relationship(back_populates="budgets")
    category_plans: Mapped[list["BudgetCategoryPlan"]] = relationship(
        back_populates="budget", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="budget", cascade="all, delete-orphan"
    )
    income_sources: Mapped[list["IncomeSource"]] = relationship(
        back_populates="budget", cascade="all, delete-orphan"
    )
    fund_transfers: Mapped[list["FundTransfer"]] = relationship(
        back_populates="budget", cascade="all, delete-orphan"
    )


RolloverType = SAEnum("reset", "rollover", "capped", name="rollover_type")
