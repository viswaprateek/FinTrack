from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.routers._helpers import not_found, parse_id
from app.api.v1.routers.budgets import _get_owned_budget
from app.core.database import get_db
from app.models.budget_category_plan import BudgetCategoryPlan
from app.models.category import Category
from app.models.fund_transfer import FundTransfer
from app.models.transaction import Transaction, TransactionSplit
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, MoveFundsRequest

router = APIRouter(prefix="/budgets/{budget_id}/categories", tags=["categories"])


def _spent_by_category(db: Session, budget_id: int) -> dict[int, Decimal]:
    direct = db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount))
        .where(
            Transaction.budget_id == budget_id,
            Transaction.type == "expense",
            Transaction.is_split.is_(False),
        )
        .group_by(Transaction.category_id)
    ).all()
    split = db.execute(
        select(TransactionSplit.category_id, func.sum(TransactionSplit.amount))
        .join(Transaction, TransactionSplit.transaction_id == Transaction.id)
        .where(
            Transaction.budget_id == budget_id,
            Transaction.type == "expense",
            Transaction.is_split.is_(True),
        )
        .group_by(TransactionSplit.category_id)
    ).all()

    totals: dict[int, Decimal] = {}
    for category_id, amount in (*direct, *split):
        if category_id is None:
            continue
        totals[category_id] = totals.get(category_id, Decimal("0")) + Decimal(amount)
    return totals


def _to_response(plan: BudgetCategoryPlan, spent: Decimal) -> CategoryResponse:
    # "Effective" planned envelope = what was budgeted plus whatever rolled in / was adjusted.
    effective_planned = plan.planned_amount + plan.starting_balance + plan.manual_adjustment
    return CategoryResponse(
        id=str(plan.category_id),
        name=plan.category.name,
        planned=effective_planned,
        spent=spent,
        rolloverType=plan.rollover_type,
        rolloverCap=plan.rollover_cap,
    )


def _get_owned_category(db: Session, user: User, category_id_raw: str) -> Category:
    category_id = parse_id(category_id_raw, label="category id")
    category = db.get(Category, category_id)
    if category is None or category.user_id != user.id:
        raise not_found("Category")
    return category


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    plans = db.scalars(
        select(BudgetCategoryPlan).where(BudgetCategoryPlan.budget_id == budget.id)
    ).all()
    spent = _spent_by_category(db, budget.id)
    return [_to_response(plan, spent.get(plan.category_id, Decimal("0"))) for plan in plans]


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    budget_id: str,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)

    category = db.scalar(
        select(Category).where(Category.user_id == current_user.id, Category.name == payload.name)
    )
    if category is None:
        category = Category(user_id=current_user.id, name=payload.name)
        db.add(category)
        db.flush()

    existing_plan = db.scalar(
        select(BudgetCategoryPlan).where(
            BudgetCategoryPlan.budget_id == budget.id, BudgetCategoryPlan.category_id == category.id
        )
    )
    if existing_plan is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists in this budget")

    plan = BudgetCategoryPlan(
        budget_id=budget.id,
        category_id=category.id,
        planned_amount=payload.planned_amount,
        rollover_type=payload.rollover_type,
        rollover_cap=payload.rollover_cap,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _to_response(plan, Decimal("0"))


@router.post("/move-funds", status_code=204)
def move_funds(
    budget_id: str,
    payload: MoveFundsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shift planned amounts between two envelopes within the same budget and record it."""
    budget = _get_owned_budget(db, current_user, budget_id)
    from_category = _get_owned_category(db, current_user, payload.from_category_id)
    to_category = _get_owned_category(db, current_user, payload.to_category_id)

    from_plan = db.scalar(
        select(BudgetCategoryPlan).where(
            BudgetCategoryPlan.budget_id == budget.id, BudgetCategoryPlan.category_id == from_category.id
        )
    )
    to_plan = db.scalar(
        select(BudgetCategoryPlan).where(
            BudgetCategoryPlan.budget_id == budget.id, BudgetCategoryPlan.category_id == to_category.id
        )
    )
    if from_plan is None or to_plan is None:
        raise not_found("Category plan")
    if payload.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

    from_plan.manual_adjustment -= payload.amount
    to_plan.manual_adjustment += payload.amount

    db.add(
        FundTransfer(
            budget_id=budget.id,
            from_category_id=from_category.id,
            to_category_id=to_category.id,
            amount=payload.amount,
            note=payload.note,
        )
    )
    db.commit()


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    budget_id: str,
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    category = _get_owned_category(db, current_user, category_id)
    plan = db.scalar(
        select(BudgetCategoryPlan).where(
            BudgetCategoryPlan.budget_id == budget.id, BudgetCategoryPlan.category_id == category.id
        )
    )
    if plan is None:
        raise not_found("Category plan")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        category.name = data.pop("name")
    for field, value in data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    spent = _spent_by_category(db, budget.id).get(plan.category_id, Decimal("0"))
    return _to_response(plan, spent)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    budget_id: str,
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    category = _get_owned_category(db, current_user, category_id)
    plan = db.scalar(
        select(BudgetCategoryPlan).where(
            BudgetCategoryPlan.budget_id == budget.id, BudgetCategoryPlan.category_id == category.id
        )
    )
    if plan is None:
        raise not_found("Category plan")
    db.delete(plan)
    db.commit()


