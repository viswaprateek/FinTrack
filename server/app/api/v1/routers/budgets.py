from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.routers._helpers import format_period, not_found, parse_id
from app.core.database import get_db
from app.models.budget import Budget
from app.models.budget_category_plan import BudgetCategoryPlan
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _planned_total(db: Session, budget_id: int) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(BudgetCategoryPlan.planned_amount), 0)).where(
            BudgetCategoryPlan.budget_id == budget_id
        )
    )
    return Decimal(total)


def _spent_total(db: Session, budget_id: int) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.budget_id == budget_id, Transaction.type == "expense"
        )
    )
    return Decimal(total)


def _to_response(db: Session, budget: Budget) -> BudgetResponse:
    return BudgetResponse(
        id=str(budget.id),
        name=budget.name,
        period=format_period(budget.period_start, budget.period_end),
        plannedTotal=_planned_total(db, budget.id),
        spentTotal=_spent_total(db, budget.id),
    )


def _get_owned_budget(db: Session, user: User, budget_id_raw: str) -> Budget:
    budget_id = parse_id(budget_id_raw, label="budget id")
    budget = db.get(Budget, budget_id)
    if budget is None or budget.user_id != user.id:
        raise not_found("Budget")
    return budget


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = db.scalars(
        select(Budget).where(Budget.user_id == current_user.id).order_by(Budget.period_start.desc())
    ).all()
    return [_to_response(db, b) for b in budgets]


@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = Budget(user_id=current_user.id, **payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _to_response(db, budget)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    return _to_response(db, budget)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return _to_response(db, budget)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    db.delete(budget)
    db.commit()
