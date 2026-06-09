import datetime as dt
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.utils import parse_id
from app.integrations.email import expense_share_invite_email
from app.models.expense_share import ExpenseShare, ExpenseShareParticipant
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.expense_share import (
    ExpenseShareParticipantUpdate,
    ExpenseShareResponse,
    ExpenseShareUpdate,
    FriendSplitInput,
    PublicOweResponse,
)
from app.services.expense_amount import friends_owed_total


class ExpenseShareService:
    def __init__(self, db: Session):
        self.db = db

    def _format_currency(self, user: User, amount: Decimal) -> str:
        return f"{user.default_currency} {amount:,.2f}"

    def _payer_display_name(self, user: User) -> str:
        if user.first_name:
            return user.first_name
        return user.email.split("@")[0]

    def _owe_url(self, token: str) -> str:
        base = settings.APP_BASE_URL.rstrip("/")
        return f"{base}/owe/{token}"

    def _participant_response(self, p: ExpenseShareParticipant) -> dict:
        return {
            "id": str(p.id),
            "email": p.email,
            "amountOwed": p.amount_owed,
            "status": p.status,
            "paidAt": p.paid_at.isoformat() if p.paid_at else None,
            "lastRemindedAt": p.last_reminded_at.isoformat() if p.last_reminded_at else None,
        }

    def _to_response(self, share: ExpenseShare) -> ExpenseShareResponse:
        tx = share.transaction
        friends_total = friends_owed_total(tx)
        return ExpenseShareResponse(
            id=str(share.id),
            transactionId=str(tx.id),
            description=tx.description,
            transactionDate=tx.date.isoformat(),
            totalAmount=tx.amount,
            yourShare=tx.amount - friends_total,
            reminderFrequency=share.reminder_frequency,
            participants=[self._participant_response(p) for p in share.participants],
        )

    def _load_share(self, share_id: int) -> ExpenseShare:
        share = self.db.scalar(
            select(ExpenseShare)
            .where(ExpenseShare.id == share_id)
            .options(
                selectinload(ExpenseShare.participants),
                selectinload(ExpenseShare.transaction),
                selectinload(ExpenseShare.created_by),
            )
        )
        if share is None:
            raise NotFoundError("Expense share")
        return share

    def create_for_transaction(
        self,
        user: User,
        transaction: Transaction,
        friend_splits: list[FriendSplitInput],
        reminder_frequency: str,
    ) -> ExpenseShare:
        if transaction.type != "expense":
            raise BadRequestError("Friend splits are only supported for expenses")

        friends_total = sum((s.amount for s in friend_splits), Decimal("0"))
        if friends_total <= 0:
            raise BadRequestError("Friend split amounts must be greater than zero")
        if friends_total > transaction.amount:
            raise BadRequestError("Friend split amounts cannot exceed the transaction amount")

        share = ExpenseShare(
            transaction_id=transaction.id,
            created_by_user_id=user.id,
            reminder_frequency=reminder_frequency,
        )
        self.db.add(share)
        self.db.flush()

        seen_emails: set[str] = set()
        for split in friend_splits:
            email = split.email.strip().lower()
            if email in seen_emails:
                raise BadRequestError(f"Duplicate friend email: {email}")
            seen_emails.add(email)

            linked = self.db.scalar(select(User).where(User.email == email))
            participant = ExpenseShareParticipant(
                expense_share_id=share.id,
                email=email,
                linked_user_id=linked.id if linked else None,
                amount_owed=split.amount,
            )
            self.db.add(participant)

        self.db.flush()
        return self._load_share(share.id)

    def send_initial_notifications(self, user: User, share: ExpenseShare) -> None:
        payer = self._payer_display_name(user)
        for participant in share.participants:
            if participant.status != "pending":
                continue
            expense_share_invite_email(
                to=participant.email,
                payer_name=payer,
                description=share.transaction.description,
                amount=self._format_currency(user, participant.amount_owed),
                owe_url=self._owe_url(participant.view_token),
                is_reminder=False,
            )
            participant.last_reminded_at = dt.datetime.utcnow()

    def list_for_user(self, user: User) -> list[ExpenseShareResponse]:
        shares = self.db.scalars(
            select(ExpenseShare)
            .where(ExpenseShare.created_by_user_id == user.id)
            .options(
                selectinload(ExpenseShare.participants),
                selectinload(ExpenseShare.transaction),
            )
            .order_by(ExpenseShare.created_at.desc())
        ).all()
        return [self._to_response(s) for s in shares]

    def get_share(self, user: User, share_id_raw: str) -> ExpenseShareResponse:
        share_id = parse_id(share_id_raw, label="expense share id")
        share = self._load_share(share_id)
        if share.created_by_user_id != user.id:
            raise NotFoundError("Expense share")
        return self._to_response(share)

    def update_share(
        self, user: User, share_id_raw: str, payload: ExpenseShareUpdate
    ) -> ExpenseShareResponse:
        share_id = parse_id(share_id_raw, label="expense share id")
        share = self._load_share(share_id)
        if share.created_by_user_id != user.id:
            raise NotFoundError("Expense share")
        if payload.reminder_frequency is not None:
            share.reminder_frequency = payload.reminder_frequency
        self.db.commit()
        return self._to_response(self._load_share(share_id))

    def update_participant(
        self, user: User, participant_id_raw: str, payload: ExpenseShareParticipantUpdate
    ) -> ExpenseShareResponse:
        participant_id = parse_id(participant_id_raw, label="participant id")
        participant = self.db.scalar(
            select(ExpenseShareParticipant)
            .where(ExpenseShareParticipant.id == participant_id)
            .options(
                selectinload(ExpenseShareParticipant.expense_share).selectinload(
                    ExpenseShare.transaction
                ),
                selectinload(ExpenseShareParticipant.expense_share).selectinload(
                    ExpenseShare.participants
                ),
            )
        )
        if participant is None:
            raise NotFoundError("Participant")
        share = participant.expense_share
        if share.created_by_user_id != user.id:
            raise NotFoundError("Participant")

        if payload.status is not None:
            participant.status = payload.status
            participant.paid_at = dt.datetime.utcnow() if payload.status == "paid" else None

        self.db.commit()
        return self._to_response(self._load_share(share.id))

    def get_public_owe(self, token: str) -> PublicOweResponse:
        participant = self.db.scalar(
            select(ExpenseShareParticipant)
            .where(ExpenseShareParticipant.view_token == token)
            .options(
                selectinload(ExpenseShareParticipant.expense_share).selectinload(
                    ExpenseShare.transaction
                ),
                selectinload(ExpenseShareParticipant.expense_share).selectinload(
                    ExpenseShare.created_by
                ),
            )
        )
        if participant is None:
            raise NotFoundError("Owe link")

        share = participant.expense_share
        payer = share.created_by
        payer_name = payer.first_name or payer.email.split("@")[0]
        tx = share.transaction

        return PublicOweResponse(
            payerName=payer_name,
            description=tx.description,
            date=tx.date.isoformat(),
            amountOwed=participant.amount_owed,
            currency=payer.default_currency,
            status=participant.status,
        )

    def outstanding_total(self, user: User) -> Decimal:
        rows = self.db.scalars(
            select(ExpenseShareParticipant)
            .join(ExpenseShare, ExpenseShareParticipant.expense_share_id == ExpenseShare.id)
            .where(
                ExpenseShare.created_by_user_id == user.id,
                ExpenseShareParticipant.status == "pending",
            )
        ).all()
        return sum((r.amount_owed for r in rows), Decimal("0"))

    def process_reminders(self) -> int:
        """Send due weekly/monthly reminders. Returns count sent."""
        now = dt.datetime.utcnow()
        shares = self.db.scalars(
            select(ExpenseShare)
            .where(ExpenseShare.reminder_frequency.in_(["weekly", "monthly"]))
            .options(
                selectinload(ExpenseShare.participants),
                selectinload(ExpenseShare.transaction),
                selectinload(ExpenseShare.created_by),
            )
        ).all()

        sent = 0
        for share in shares:
            payer = share.created_by
            if not payer.share_reminders_enabled:
                continue

            delta = dt.timedelta(days=7 if share.reminder_frequency == "weekly" else 30)
            payer_name = self._payer_display_name(payer)

            for participant in share.participants:
                if participant.status != "pending":
                    continue
                if participant.last_reminded_at and (now - participant.last_reminded_at) < delta:
                    continue

                ok = expense_share_invite_email(
                    to=participant.email,
                    payer_name=payer_name,
                    description=share.transaction.description,
                    amount=self._format_currency(payer, participant.amount_owed),
                    owe_url=self._owe_url(participant.view_token),
                    is_reminder=True,
                )
                if ok:
                    participant.last_reminded_at = now
                    sent += 1

        self.db.commit()
        return sent
