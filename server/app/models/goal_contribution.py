import datetime as dt
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.goal import MONEY


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contributed_at: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False)

    goal: Mapped["Goal"] = relationship(back_populates="contributions")
