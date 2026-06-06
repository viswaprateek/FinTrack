from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)


class FundTransfer(Base, TimestampMixin):
    """Audit trail for "Move Funds" actions between envelopes within a budget."""

    __tablename__ = "fund_transfers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    from_category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    to_category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    budget: Mapped["Budget"] = relationship(back_populates="fund_transfers")
    from_category: Mapped["Category | None"] = relationship(foreign_keys=[from_category_id])
    to_category: Mapped["Category | None"] = relationship(foreign_keys=[to_category_id])
