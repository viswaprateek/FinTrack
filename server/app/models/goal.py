import datetime as dt
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_goal_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0"), server_default="0")
    target_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")

    user: Mapped["User"] = relationship(back_populates="goals")
    contributions: Mapped[list["GoalContribution"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan", order_by="GoalContribution.contributed_at.desc()"
    )
