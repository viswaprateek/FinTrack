from collections import defaultdict
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.core.utils import format_period, parse_id
from app.models.budget import Budget
from app.models.budget_category_plan import BudgetCategoryPlan
from app.models.category import Category
from app.models.expense_share import ExpenseShare
from app.models.transaction import Transaction
from app.models.user import User
from app.services.category_kind import income_category_clause
from app.services.expense_amount import payer_expense_amount
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate


class BudgetService:
    def __init__(self, db: Session):
        self.db = db

    def _planned_total(self, budget_id: int) -> Decimal:
        total = self.db.scalar(
            select(func.coalesce(func.sum(BudgetCategoryPlan.planned_amount), 0))
            .select_from(BudgetCategoryPlan)
            .join(Category, BudgetCategoryPlan.category_id == Category.id)
            .where(BudgetCategoryPlan.budget_id == budget_id)
            .where(~income_category_clause())
        )
        return Decimal(total)

    def _spent_total(self, budget_id: int) -> Decimal:
        transactions = self.db.scalars(
            select(Transaction)
            .where(Transaction.budget_id == budget_id, Transaction.type == "expense")
            .options(
                selectinload(Transaction.expense_share).selectinload(ExpenseShare.participants)
            )
        ).all()
        return sum((payer_expense_amount(tx) for tx in transactions), Decimal("0"))

    def _to_response(self, budget: Budget) -> BudgetResponse:
        return BudgetResponse(
            id=str(budget.id),
            name=budget.name,
            period=format_period(budget.period_start, budget.period_end),
            periodStart=budget.period_start,
            periodEnd=budget.period_end,
            plannedTotal=self._planned_total(budget.id),
            spentTotal=self._spent_total(budget.id),
        )

    def get_owned_budget(self, user: User, budget_id_raw: str) -> Budget:
        budget_id = parse_id(budget_id_raw, label="budget id")
        budget = self.db.get(Budget, budget_id)
        if budget is None or budget.user_id != user.id:
            raise NotFoundError("Budget")
        return budget

    def _planned_totals_by_budget(self, budget_ids: list[int]) -> dict[int, Decimal]:
        if not budget_ids:
            return {}
        rows = self.db.execute(
            select(
                BudgetCategoryPlan.budget_id,
                func.coalesce(func.sum(BudgetCategoryPlan.planned_amount), 0),
            )
            .select_from(BudgetCategoryPlan)
            .join(Category, BudgetCategoryPlan.category_id == Category.id)
            .where(BudgetCategoryPlan.budget_id.in_(budget_ids))
            .where(~income_category_clause())
            .group_by(BudgetCategoryPlan.budget_id)
        ).all()
        return {budget_id: Decimal(total) for budget_id, total in rows}

    def _spent_totals_by_budget(self, budget_ids: list[int]) -> dict[int, Decimal]:
        if not budget_ids:
            return {}
        transactions = self.db.scalars(
            select(Transaction)
            .where(Transaction.budget_id.in_(budget_ids), Transaction.type == "expense")
            .options(
                selectinload(Transaction.expense_share).selectinload(ExpenseShare.participants)
            )
        ).all()
        totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
        for tx in transactions:
            totals[tx.budget_id] += payer_expense_amount(tx)
        return dict(totals)

    def list_budgets(self, user: User) -> list[BudgetResponse]:
        budgets = self.db.scalars(
            select(Budget).where(Budget.user_id == user.id).order_by(Budget.period_start.desc())
        ).all()
        if not budgets:
            return []

        budget_ids = [b.id for b in budgets]
        planned_by_budget = self._planned_totals_by_budget(budget_ids)
        spent_by_budget = self._spent_totals_by_budget(budget_ids)

        return [
            BudgetResponse(
                id=str(budget.id),
                name=budget.name,
                period=format_period(budget.period_start, budget.period_end),
                periodStart=budget.period_start,
                periodEnd=budget.period_end,
                plannedTotal=planned_by_budget.get(budget.id, Decimal("0")),
                spentTotal=spent_by_budget.get(budget.id, Decimal("0")),
            )
            for budget in budgets
        ]

    def get_budget(self, user: User, budget_id: str) -> BudgetResponse:
        budget = self.get_owned_budget(user, budget_id)
        return self._to_response(budget)

    def create_budget(self, user: User, payload: BudgetCreate) -> BudgetResponse:
        duplicate = self.db.scalar(
            select(Budget).where(
                Budget.user_id == user.id,
                Budget.period_start == payload.period_start,
                Budget.period_end == payload.period_end,
            )
        )
        if duplicate is not None:
            raise ConflictError(
                f"A budget already exists for {payload.period_start.isoformat()} "
                f"to {payload.period_end.isoformat()}"
            )

        data = payload.model_dump(exclude={"copy_from_budget_id"})
        budget = Budget(user_id=user.id, **data)
        self.db.add(budget)
        self.db.flush()

        if payload.copy_from_budget_id:
            from app.services.category_service import CategoryService

            CategoryService(self.db).copy_envelopes_to_budget(
                user, payload.copy_from_budget_id, budget.id
            )

        self.db.commit()
        self.db.refresh(budget)
        return self._to_response(budget)

    def update_budget(self, user: User, budget_id: str, payload: BudgetUpdate) -> BudgetResponse:
        budget = self.get_owned_budget(user, budget_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(budget, field, value)
        self.db.commit()
        self.db.refresh(budget)
        return self._to_response(budget)

    def delete_budget(self, user: User, budget_id: str) -> None:
        budget = self.get_owned_budget(user, budget_id)
        self.db.delete(budget)
        self.db.commit()
