import calendar
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import SUPPORTED_CURRENCIES
from app.core.exceptions import BadRequestError
from app.models.budget import Budget
from app.models.credit_card import CreditCard
from app.models.user import User
from app.schemas.budget import BudgetCreate
from app.schemas.category import CategoryCreate
from app.schemas.goal import GoalCreate
from app.schemas.onboarding import OnboardingCompleteResponse
from app.schemas.transaction import TransactionCreate
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.credit_card_service import CreditCardService
from app.services.goal_service import GoalService
from app.services.transaction_service import TransactionService

_DEMO_CATEGORIES: list[tuple[str, str, Decimal]] = [
    ("Groceries", "groceries", Decimal("8000")),
    ("Rent", "rent", Decimal("15000")),
    ("Dining Out", "dining", Decimal("3000")),
    ("Transport", "transport", Decimal("2500")),
    ("Salary", "salary", Decimal("50000")),
]

TxType = Literal["income", "expense"]

# (category_name, day_of_month, description, amount, type)
_DEMO_BUDGET_TRANSACTIONS: list[tuple[str, int, str, Decimal, TxType]] = [
    ("Salary", 5, "Monthly salary", Decimal("50000"), "income"),
    ("Rent", 1, "Rent payment", Decimal("15000"), "expense"),
    ("Groceries", 8, "Weekly groceries", Decimal("2450"), "expense"),
    ("Groceries", 15, "Farmers market", Decimal("890"), "expense"),
    ("Dining Out", 12, "Dinner with friends", Decimal("680"), "expense"),
    ("Transport", 10, "Metro pass", Decimal("350"), "expense"),
    ("Dining Out", 20, "Lunch out", Decimal("420"), "expense"),
]


class OnboardingService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)
        self.categories = CategoryService(db)
        self.transactions = TransactionService(db)
        self.goals = GoalService(db)
        self.cards = CreditCardService(db)

    def _current_month_period(self) -> tuple[date, date, str]:
        today = date.today()
        start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end = today.replace(day=last_day)
        name = start.strftime("%B %Y")
        return start, end, name

    def _has_workspace_data(self, user: User) -> bool:
        return self.db.scalar(select(Budget.id).where(Budget.user_id == user.id).limit(1)) is not None

    def _demo_date(self, period_start: date, period_end: date, day: int) -> date:
        clamped = min(max(day, 1), period_end.day)
        return period_start.replace(day=clamped)

    def seed_demo_workspace(self, user: User) -> bool:
        """Seed a minimal demo workspace. Returns True if data was created."""
        if self._has_workspace_data(user):
            return False

        period_start, period_end, name = self._current_month_period()
        budget = self.budgets.create_budget(
            user,
            BudgetCreate(name=name, period_start=period_start, period_end=period_end),
        )

        category_ids: dict[str, str] = {}
        for cat_name, icon, planned in _DEMO_CATEGORIES:
            created = self.categories.create_category(
                user,
                budget.id,
                CategoryCreate(name=cat_name, icon=icon, planned_amount=planned),
            )
            category_ids[cat_name] = created.id

        for cat_name, day, description, amount, tx_type in _DEMO_BUDGET_TRANSACTIONS:
            self.transactions.create_transaction(
                user,
                TransactionCreate(
                    budget_id=budget.id,
                    category_id=category_ids[cat_name],
                    date=self._demo_date(period_start, period_end, day),
                    description=description,
                    amount=amount,
                    type=tx_type,
                ),
            )

        from app.models.goal import Goal

        if self.db.scalar(select(Goal.id).where(Goal.user_id == user.id).limit(1)) is None:
            self.goals.create_goal(
                user,
                GoalCreate(
                    name="Emergency Fund",
                    icon="emergency",
                    target_amount=Decimal("10000"),
                    current_amount=Decimal("1500"),
                ),
            )
            self.goals.create_goal(
                user,
                GoalCreate(
                    name="Vacation",
                    icon="vacation",
                    target_amount=Decimal("5000"),
                    current_amount=Decimal("800"),
                ),
            )

        if self.db.scalar(select(CreditCard.id).where(CreditCard.user_id == user.id).limit(1)) is None:
            self.cards.seed_demo_cards(user, minimal=True)

        return True

    def complete_onboarding(
        self, user: User, *, seed_demo: bool, default_currency: str | None
    ) -> OnboardingCompleteResponse:
        if default_currency is not None:
            code = default_currency.upper()
            if code not in SUPPORTED_CURRENCIES:
                raise BadRequestError(f"Unsupported currency: {default_currency}")
            user.default_currency = code

        seeded = False
        if seed_demo:
            seeded = self.seed_demo_workspace(user)

        user.onboarding_completed_at = datetime.now()
        self.db.commit()
        self.db.refresh(user)

        return OnboardingCompleteResponse(
            onboardingCompleted=True,
            seededDemo=seeded,
        )
