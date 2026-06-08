from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

CategoryType = SAEnum("expense", "income", name="category_type")


class Category(Base, TimestampMixin):
    """A reusable, user-scoped envelope label (e.g. "Groceries"). Per-budget planning
    lives in BudgetCategoryPlan so the same category can be reused across budgets/months."""

    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_category_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type: Mapped[str] = mapped_column(CategoryType, default="expense", server_default="expense")
    is_uncategorized: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")

    user: Mapped["User"] = relationship(back_populates="categories")
    plans: Mapped[list["BudgetCategoryPlan"]] = relationship(back_populates="category")
