from datetime import date, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.v1.routers._helpers import not_found, parse_id
from app.api.v1.routers.budgets import _get_owned_budget
from app.api.v1.routers.categories import _get_owned_category
from app.core.database import get_db
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

router = APIRouter(tags=["recurring"])

UNCATEGORIZED = "Uncategorized"

_FREQUENCY_STEP = {
    "weekly": relativedelta(weeks=1),
    "monthly": relativedelta(months=1),
    "quarterly": relativedelta(months=3),
    "yearly": relativedelta(years=1),
}


def _advance(due: date, frequency: str) -> date:
    return due + _FREQUENCY_STEP[frequency]


def _to_response(rule: RecurringRule) -> RecurringRuleResponse:
    return RecurringRuleResponse(
        id=str(rule.id),
        name=rule.name,
        amount=rule.amount,
        frequency=rule.frequency,
        nextDue=rule.next_due.isoformat(),
        category=rule.category.name if rule.category else UNCATEGORIZED,
        status="active" if rule.is_active else "paused",
    )


def _get_owned_rule(db: Session, user: User, rule_id_raw: str) -> RecurringRule:
    rule_id = parse_id(rule_id_raw, label="recurring rule id")
    rule = db.scalar(
        select(RecurringRule)
        .where(RecurringRule.id == rule_id)
        .options(selectinload(RecurringRule.category))
    )
    if rule is None or rule.user_id != user.id:
        raise not_found("Recurring rule")
    return rule


@router.get("/recurring-rules", response_model=list[RecurringRuleResponse])
def list_recurring_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = db.scalars(
        select(RecurringRule)
        .where(RecurringRule.user_id == current_user.id)
        .options(selectinload(RecurringRule.category))
        .order_by(RecurringRule.next_due.asc())
    ).all()
    return [_to_response(r) for r in rules]


@router.get("/recurring-rules/upcoming", response_model=list[UpcomingBillResponse])
def list_upcoming_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(default=30, ge=1, le=365),
):
    horizon = date.today() + timedelta(days=days)
    rules = db.scalars(
        select(RecurringRule)
        .where(
            RecurringRule.user_id == current_user.id,
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


@router.post("/recurring-rules", response_model=RecurringRuleResponse, status_code=201)
def create_recurring_rule(
    payload: RecurringRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = (
        _get_owned_category(db, current_user, payload.category_id) if payload.category_id else None
    )
    rule = RecurringRule(
        user_id=current_user.id,
        category_id=category.id if category else None,
        name=payload.name,
        amount=payload.amount,
        frequency=payload.frequency,
        next_due=payload.next_due,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _to_response(rule)


@router.patch("/recurring-rules/{rule_id}", response_model=RecurringRuleResponse)
def update_recurring_rule(
    rule_id: str,
    payload: RecurringRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = _get_owned_rule(db, current_user, rule_id)
    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data:
        raw = data.pop("category_id")
        rule.category_id = _get_owned_category(db, current_user, raw).id if raw else None
    if "status" in data:
        rule.is_active = data.pop("status") == "active"

    for field, value in data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return _to_response(rule)


@router.delete("/recurring-rules/{rule_id}", status_code=204)
def delete_recurring_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = _get_owned_rule(db, current_user, rule_id)
    db.delete(rule)
    db.commit()


@router.post("/recurring-rules/{rule_id}/post", response_model=RecurringRuleResponse)
def post_recurring_rule(
    rule_id: str,
    payload: PostRecurringRuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a due bill as posted: creates the corresponding transaction and
    advances `next_due` to the following occurrence."""
    rule = _get_owned_rule(db, current_user, rule_id)
    budget = _get_owned_budget(db, current_user, payload.budget_id)
    posted_on = payload.date or rule.next_due

    db.add(
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
    rule.next_due = _advance(rule.next_due, rule.frequency)
    db.commit()
    db.refresh(rule)
    return _to_response(rule)
