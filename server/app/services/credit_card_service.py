from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.utils import parse_id
from app.models.card_transaction import CardTransaction
from app.models.credit_card import CreditCard
from app.models.user import User
from app.schemas.credit_card import (
    CardTransactionCreate,
    CardTransactionResponse,
    CreditCardCreate,
    CreditCardResponse,
    CreditCardUpdate,
)

_DEMO_CARDS = [
    {
        "label": "Everyday Visa",
        "cardholder_name": "Demo User",
        "last_four": "9743",
        "brand": "visa",
        "theme": "lime",
        "credit_limit": Decimal("50000"),
        "current_balance": Decimal("12808"),
        "expiry_month": 2,
        "expiry_year": 2028,
    },
    {
        "label": "PayPal Credit",
        "cardholder_name": "Demo User",
        "last_four": "8821",
        "brand": "paypal",
        "theme": "yellow",
        "credit_limit": Decimal("25000"),
        "current_balance": Decimal("4300"),
        "expiry_month": 8,
        "expiry_year": 2027,
    },
    {
        "label": "Business Amex",
        "cardholder_name": "Demo User",
        "last_four": "3310",
        "brand": "amex",
        "theme": "navy",
        "credit_limit": Decimal("100000"),
        "current_balance": Decimal("18750"),
        "expiry_month": 11,
        "expiry_year": 2029,
    },
]

_DEMO_TRANSACTIONS = [
    ("Everyday Visa", "Brody Zmymo — Sent", Decimal("128.08"), "Transfer", 1),
    ("Everyday Visa", "Gym — Payment", Decimal("30.08"), "Health", 2),
    ("PayPal Credit", "Amazon Purchase", Decimal("89.99"), "Shopping", 3),
    ("PayPal Credit", "Netflix", Decimal("15.99"), "Subscriptions", 5),
    ("Business Amex", "Flight Booking", Decimal("450.00"), "Travel", 4),
    ("Business Amex", "Hotel Stay", Decimal("220.50"), "Travel", 6),
]


class CreditCardService:
    def __init__(self, db: Session):
        self.db = db

    def _compute_fields(self, card: CreditCard) -> dict:
        limit = Decimal(card.credit_limit)
        balance = Decimal(card.current_balance)
        available = max(Decimal("0"), limit - balance)
        utilization = float(min(Decimal("100"), (balance / limit * 100) if limit > 0 else Decimal("0")))
        return {"availableCredit": available, "utilizationPercent": utilization}

    def _to_response(self, card: CreditCard) -> CreditCardResponse:
        computed = self._compute_fields(card)
        return CreditCardResponse(
            id=str(card.id),
            label=card.label,
            cardholderName=card.cardholder_name,
            lastFour=card.last_four,
            brand=card.brand,
            theme=card.theme,
            creditLimit=card.credit_limit,
            currentBalance=card.current_balance,
            expiryMonth=card.expiry_month,
            expiryYear=card.expiry_year,
            isActive=card.is_active,
            **computed,
        )

    def _transaction_to_response(self, txn: CardTransaction) -> CardTransactionResponse:
        return CardTransactionResponse(
            id=str(txn.id),
            cardId=str(txn.card_id),
            cardLabel=txn.card.label,
            description=txn.description,
            amount=txn.amount,
            category=txn.category,
            transactedAt=txn.transacted_at.isoformat(),
        )

    def _get_owned_card(self, user: User, card_id_raw: str) -> CreditCard:
        card_id = parse_id(card_id_raw, label="card id")
        card = self.db.get(CreditCard, card_id)
        if card is None or card.user_id != user.id:
            raise NotFoundError("Card")
        return card

    def _check_label_available(self, user: User, label: str, *, exclude_card_id: int | None = None) -> None:
        existing = self.db.scalar(select(CreditCard).where(CreditCard.user_id == user.id, CreditCard.label == label))
        if existing is not None and existing.id != exclude_card_id:
            raise ConflictError("Card label already exists")

    def list_cards(self, user: User) -> list[CreditCardResponse]:
        cards = self.db.scalars(
            select(CreditCard).where(CreditCard.user_id == user.id).order_by(CreditCard.created_at.asc())
        ).all()
        return [self._to_response(c) for c in cards]

    def get_card(self, user: User, card_id: str) -> CreditCardResponse:
        return self._to_response(self._get_owned_card(user, card_id))

    def create_card(self, user: User, payload: CreditCardCreate) -> CreditCardResponse:
        self._check_label_available(user, payload.label)
        if payload.current_balance > payload.credit_limit:
            raise BadRequestError("Balance cannot exceed credit limit")

        card = CreditCard(user_id=user.id, **payload.model_dump())
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return self._to_response(card)

    def update_card(self, user: User, card_id: str, payload: CreditCardUpdate) -> CreditCardResponse:
        card = self._get_owned_card(user, card_id)
        data = payload.model_dump(exclude_unset=True)

        if "label" in data:
            self._check_label_available(user, data["label"], exclude_card_id=card.id)

        for field, value in data.items():
            setattr(card, field, value)

        if card.current_balance > card.credit_limit:
            raise BadRequestError("Balance cannot exceed credit limit")

        self.db.commit()
        self.db.refresh(card)
        return self._to_response(card)

    def delete_card(self, user: User, card_id: str) -> None:
        card = self._get_owned_card(user, card_id)
        self.db.delete(card)
        self.db.commit()

    def list_all_transactions(self, user: User, *, limit: int = 20) -> list[CardTransactionResponse]:
        txns = self.db.scalars(
            select(CardTransaction)
            .join(CreditCard)
            .where(CreditCard.user_id == user.id)
            .options(selectinload(CardTransaction.card))
            .order_by(CardTransaction.transacted_at.desc())
            .limit(limit)
        ).all()
        return [self._transaction_to_response(t) for t in txns]

    def list_card_transactions(self, user: User, card_id: str) -> list[CardTransactionResponse]:
        card = self._get_owned_card(user, card_id)
        txns = self.db.scalars(
            select(CardTransaction)
            .where(CardTransaction.card_id == card.id)
            .options(selectinload(CardTransaction.card))
            .order_by(CardTransaction.transacted_at.desc())
        ).all()
        return [self._transaction_to_response(t) for t in txns]

    def add_transaction(
        self, user: User, card_id: str, payload: CardTransactionCreate
    ) -> CreditCardResponse:
        card = self._get_owned_card(user, card_id)
        new_balance = Decimal(card.current_balance) + Decimal(payload.amount)
        if new_balance > card.credit_limit:
            raise BadRequestError("Transaction would exceed credit limit")

        txn = CardTransaction(
            card_id=card.id,
            description=payload.description,
            amount=payload.amount,
            category=payload.category,
            transacted_at=payload.transacted_at or datetime.now(),
        )
        card.current_balance = new_balance
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(card)
        return self._to_response(card)

    def seed_demo_cards(self, user: User) -> list[CreditCardResponse]:
        existing = self.db.scalar(select(CreditCard).where(CreditCard.user_id == user.id).limit(1))
        if existing is not None:
            raise ConflictError("You already have cards — demo data is only for empty wallets")

        created: dict[str, CreditCard] = {}
        for spec in _DEMO_CARDS:
            card = CreditCard(user_id=user.id, **spec)
            self.db.add(card)
            created[spec["label"]] = card

        self.db.flush()

        now = datetime.now()
        for label, description, amount, category, days_ago in _DEMO_TRANSACTIONS:
            card = created[label]
            self.db.add(
                CardTransaction(
                    card_id=card.id,
                    description=description,
                    amount=amount,
                    category=category,
                    transacted_at=now - timedelta(days=days_ago),
                )
            )

        self.db.commit()
        for card in created.values():
            self.db.refresh(card)

        return self.list_cards(user)
