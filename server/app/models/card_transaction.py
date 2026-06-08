import datetime as dt
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.credit_card import MONEY


class CardTransaction(Base):
    __tablename__ = "card_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("credit_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    transacted_at: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False)

    card: Mapped["CreditCard"] = relationship(back_populates="transactions")
