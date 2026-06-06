from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.budget import RolloverType
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)


class BudgetCategoryPlan(Base, TimestampMixin):
    """Per-budget envelope settings for a category: how much is planned, rollover
    behavior, and the carried-in balance from the prior period."""

    __tablename__ = "budget_category_plans"
    __table_args__ = (UniqueConstraint("budget_id", "category_id", name="uq_plan_budget_category"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)

    planned_amount: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"), server_default="0.00")
    rollover_type: Mapped[str] = mapped_column(RolloverType, default="reset", server_default="reset")
    rollover_cap: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    starting_balance: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"), server_default="0.00")
    manual_adjustment: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0.00"), server_default="0.00")

    budget: Mapped["Budget"] = relationship(back_populates="category_plans")
    category: Mapped["Category"] = relationship(back_populates="plans")
