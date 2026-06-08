from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

MONEY = Numeric(12, 2)

CardBrand = SAEnum("visa", "mastercard", "amex", "paypal", name="card_brand")
CardTheme = SAEnum("lime", "yellow", "navy", "emerald", "violet", name="card_theme")


class CreditCard(Base, TimestampMixin):
    __tablename__ = "credit_cards"
    __table_args__ = (UniqueConstraint("user_id", "label", name="uq_credit_card_user_label"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    cardholder_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_four: Mapped[str] = mapped_column(String(4), nullable=False)
    brand: Mapped[str] = mapped_column(CardBrand, default="visa", server_default="visa")
    theme: Mapped[str] = mapped_column(CardTheme, default="lime", server_default="lime")
    credit_limit: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(MONEY, default=Decimal("0"), server_default="0")
    expiry_month: Mapped[int] = mapped_column(Integer, nullable=False)
    expiry_year: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")

    user: Mapped["User"] = relationship(back_populates="credit_cards")
    transactions: Mapped[list["CardTransaction"]] = relationship(
        back_populates="card",
        cascade="all, delete-orphan",
        order_by="CardTransaction.transacted_at.desc()",
    )
