from datetime import date, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import UNCATEGORIZED
from app.core.exceptions import NotFoundError
from app.core.utils import parse_id
from app.models.recurring_rule import RecurringRule
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.recurring import (
    PostRecurringRuleRequest,
    RecurringRuleCreate,
    RecurringRuleResponse,
    RecurringRuleUpdate,
    UpcomingBillResponse,
)
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService

_FREQUENCY_STEP = {
    "weekly": relativedelta(weeks=1),
    "monthly": relativedelta(months=1),
    "quarterly": relativedelta(months=3),
    "yearly": relativedelta(years=1),
}


class RecurringService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)
        self.categories = CategoryService(db)

    def _advance(self, due: date, frequency: str) -> date:
        return due + _FREQUENCY_STEP[frequency]

    def _to_response(self, rule: RecurringRule) -> RecurringRuleResponse:
        return RecurringRuleResponse(
            id=str(rule.id),
            name=rule.name,
            amount=rule.amount,
            frequency=rule.frequency,
            nextDue=rule.next_due.isoformat(),
            category=rule.category.name if rule.category else UNCATEGORIZED,
            status="active" if rule.is_active else "paused",
        )

    def _get_owned_rule(self, user: User, rule_id_raw: str) -> RecurringRule:
        rule_id = parse_id(rule_id_raw, label="recurring rule id")
        rule = self.db.scalar(
            select(RecurringRule)
            .where(RecurringRule.id == rule_id)
            .options(selectinload(RecurringRule.category))
        )
        if rule is None or rule.user_id != user.id:
            raise NotFoundError("Recurring rule")
        return rule

    def list_recurring_rules(self, user: User) -> list[RecurringRuleResponse]:
        rules = self.db.scalars(
            select(RecurringRule)
            .where(RecurringRule.user_id == user.id)
            .options(selectinload(RecurringRule.category))
            .order_by(RecurringRule.next_due.asc())
        ).all()
        return [self._to_response(r) for r in rules]

    def list_upcoming_bills(self, user: User, days: int) -> list[UpcomingBillResponse]:
        horizon = date.today() + timedelta(days=days)
        rules = self.db.scalars(
            select(RecurringRule)
            .where(
                RecurringRule.user_id == user.id,
                RecurringRule.is_active.is_(True),
                RecurringRule.next_due <= horizon,
            )
            .options(selectinload(RecurringRule.category))
            .order_by(RecurringRule.next_due.asc())
        ).all()
        return [
            UpcomingBillResponse(
                id=str(r.id),
                name=r.name,
                dueDate=r.next_due.isoformat(),
                amount=r.amount,
                category=r.category.name if r.category else UNCATEGORIZED,
            )
            for r in rules
        ]

    def create_recurring_rule(self, user: User, payload: RecurringRuleCreate) -> RecurringRuleResponse:
        category = (
            self.categories.get_owned_category(user, payload.category_id)
            if payload.category_id
            else None
        )
        rule = RecurringRule(
            user_id=user.id,
            category_id=category.id if category else None,
            name=payload.name,
            amount=payload.amount,
            frequency=payload.frequency,
            next_due=payload.next_due,
        )
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return self._to_response(rule)

    def update_recurring_rule(
        self, user: User, rule_id: str, payload: RecurringRuleUpdate
    ) -> RecurringRuleResponse:
        rule = self._get_owned_rule(user, rule_id)
        data = payload.model_dump(exclude_unset=True)

        if "category_id" in data:
            raw = data.pop("category_id")
            rule.category_id = self.categories.get_owned_category(user, raw).id if raw else None
        if "status" in data:
            rule.is_active = data.pop("status") == "active"

        for field, value in data.items():
            setattr(rule, field, value)

        self.db.commit()
        self.db.refresh(rule)
        return self._to_response(rule)

    def delete_recurring_rule(self, user: User, rule_id: str) -> None:
        rule = self._get_owned_rule(user, rule_id)
        self.db.delete(rule)
        self.db.commit()

    def post_recurring_rule(
        self, user: User, rule_id: str, payload: PostRecurringRuleRequest
    ) -> RecurringRuleResponse:
        rule = self._get_owned_rule(user, rule_id)
        budget = self.budgets.get_owned_budget(user, payload.budget_id)
        posted_on = payload.date or rule.next_due

        self.db.add(
            Transaction(
                budget_id=budget.id,
                category_id=rule.category_id,
                date=posted_on,
                description=rule.name,
                amount=Decimal(rule.amount),
                type="expense",
                account=None,
                reimbursement_status="none",
                notes=f"Posted from recurring rule '{rule.name}'",
            )
        )
        rule.next_due = self._advance(rule.next_due, rule.frequency)
        self.db.commit()
        self.db.refresh(rule)
        return self._to_response(rule)
