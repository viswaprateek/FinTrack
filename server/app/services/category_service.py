from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.utils import parse_id
from app.models.budget_category_plan import BudgetCategoryPlan
from app.models.category import Category
from app.models.fund_transfer import FundTransfer
from app.models.transaction import Transaction, TransactionSplit
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, MoveFundsRequest
from app.services.budget_service import BudgetService


class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)

    def _spent_by_category(self, budget_id: int) -> dict[int, Decimal]:
        direct = self.db.execute(
            select(Transaction.category_id, func.sum(Transaction.amount))
            .where(
                Transaction.budget_id == budget_id,
                Transaction.type == "expense",
                Transaction.is_split.is_(False),
            )
            .group_by(Transaction.category_id)
        ).all()
        split = self.db.execute(
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

    def _to_response(self, plan: BudgetCategoryPlan, spent: Decimal) -> CategoryResponse:
        effective_planned = plan.planned_amount + plan.starting_balance + plan.manual_adjustment
        return CategoryResponse(
            id=str(plan.category_id),
            name=plan.category.name,
            planned=effective_planned,
            spent=spent,
            rolloverType=plan.rollover_type,
            rolloverCap=plan.rollover_cap,
        )

    def get_owned_category(self, user: User, category_id_raw: str) -> Category:
        category_id = parse_id(category_id_raw, label="category id")
        category = self.db.get(Category, category_id)
        if category is None or category.user_id != user.id:
            raise NotFoundError("Category")
        return category

    def list_categories(self, user: User, budget_id: str) -> list[CategoryResponse]:
        budget = self.budgets.get_owned_budget(user, budget_id)
        plans = self.db.scalars(
            select(BudgetCategoryPlan).where(BudgetCategoryPlan.budget_id == budget.id)
        ).all()
        spent = self._spent_by_category(budget.id)
        return [self._to_response(plan, spent.get(plan.category_id, Decimal("0"))) for plan in plans]

    def create_category(self, user: User, budget_id: str, payload: CategoryCreate) -> CategoryResponse:
        budget = self.budgets.get_owned_budget(user, budget_id)

        category = self.db.scalar(
            select(Category).where(Category.user_id == user.id, Category.name == payload.name)
        )
        if category is None:
            category = Category(user_id=user.id, name=payload.name)
            self.db.add(category)
            self.db.flush()

        existing_plan = self.db.scalar(
            select(BudgetCategoryPlan).where(
                BudgetCategoryPlan.budget_id == budget.id,
                BudgetCategoryPlan.category_id == category.id,
            )
        )
        if existing_plan is not None:
            raise ConflictError("Category already exists in this budget")

        plan = BudgetCategoryPlan(
            budget_id=budget.id,
            category_id=category.id,
            planned_amount=payload.planned_amount,
            rollover_type=payload.rollover_type,
            rollover_cap=payload.rollover_cap,
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return self._to_response(plan, Decimal("0"))

    def move_funds(self, user: User, budget_id: str, payload: MoveFundsRequest) -> None:
        budget = self.budgets.get_owned_budget(user, budget_id)
        from_category = self.get_owned_category(user, payload.from_category_id)
        to_category = self.get_owned_category(user, payload.to_category_id)

        from_plan = self.db.scalar(
            select(BudgetCategoryPlan).where(
                BudgetCategoryPlan.budget_id == budget.id,
                BudgetCategoryPlan.category_id == from_category.id,
            )
        )
        to_plan = self.db.scalar(
            select(BudgetCategoryPlan).where(
                BudgetCategoryPlan.budget_id == budget.id,
                BudgetCategoryPlan.category_id == to_category.id,
            )
        )
        if from_plan is None or to_plan is None:
            raise NotFoundError("Category plan")
        if payload.amount <= 0:
            raise BadRequestError("Amount must be positive")

        from_plan.manual_adjustment -= payload.amount
        to_plan.manual_adjustment += payload.amount

        self.db.add(
            FundTransfer(
                budget_id=budget.id,
                from_category_id=from_category.id,
                to_category_id=to_category.id,
                amount=payload.amount,
                note=payload.note,
            )
        )
        self.db.commit()

    def update_category(
        self, user: User, budget_id: str, category_id: str, payload: CategoryUpdate
    ) -> CategoryResponse:
        budget = self.budgets.get_owned_budget(user, budget_id)
        category = self.get_owned_category(user, category_id)
        plan = self.db.scalar(
            select(BudgetCategoryPlan).where(
                BudgetCategoryPlan.budget_id == budget.id,
                BudgetCategoryPlan.category_id == category.id,
            )
        )
        if plan is None:
            raise NotFoundError("Category plan")

        data = payload.model_dump(exclude_unset=True)
        if "name" in data:
            category.name = data.pop("name")
        for field, value in data.items():
            setattr(plan, field, value)

        self.db.commit()
        self.db.refresh(plan)
        spent = self._spent_by_category(budget.id).get(plan.category_id, Decimal("0"))
        return self._to_response(plan, spent)

    def delete_category(self, user: User, budget_id: str, category_id: str) -> None:
        budget = self.budgets.get_owned_budget(user, budget_id)
        category = self.get_owned_category(user, category_id)
        plan = self.db.scalar(
            select(BudgetCategoryPlan).where(
                BudgetCategoryPlan.budget_id == budget.id,
                BudgetCategoryPlan.category_id == category.id,
            )
        )
        if plan is None:
            raise NotFoundError("Category plan")
        self.db.delete(plan)
        self.db.commit()
