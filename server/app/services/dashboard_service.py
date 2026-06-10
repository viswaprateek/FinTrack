import datetime as dt

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.budget import BudgetResponse
from app.schemas.dashboard import DashboardBootstrapResponse
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.expense_share_service import ExpenseShareService
from app.services.income_source_service import IncomeSourceService
from app.services.recurring_service import RecurringService
from app.services.transaction_service import TransactionService

UPCOMING_BILL_DAYS = 7


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)
        self.categories = CategoryService(db)
        self.transactions = TransactionService(db)
        self.recurring = RecurringService(db)
        self.income_sources = IncomeSourceService(db)
        self.expense_shares = ExpenseShareService(db)

    def _resolve_active_budget_id(
        self, budgets: list[BudgetResponse], budget_id: str | None
    ) -> str | None:
        if not budgets:
            return None

        if budget_id:
            for budget in budgets:
                if budget.id == budget_id:
                    return budget.id

        today = dt.date.today()
        for budget in budgets:
            if budget.periodStart <= today <= budget.periodEnd:
                return budget.id

        return budgets[0].id

    def get_bootstrap(self, user: User, *, budget_id: str | None = None) -> DashboardBootstrapResponse:
        budgets = self.budgets.list_budgets(user)
        active_id = self._resolve_active_budget_id(budgets, budget_id)

        friends_owe = self.expense_shares.outstanding_total(user)
        you_owe = self.expense_shares.owed_total(user)
        upcoming = self.recurring.list_upcoming_bills(user, UPCOMING_BILL_DAYS)

        if active_id is None:
            return DashboardBootstrapResponse(
                budgets=budgets,
                activeBudgetId=None,
                categories=[],
                transactions=[],
                upcomingBills=upcoming,
                incomeSources=[],
                friendsOweTotal=friends_owe,
                youOweTotal=you_owe,
            )

        categories = self.categories.list_categories(user, active_id)
        transactions = self.transactions.list_transactions(user, budget_id=active_id)
        income_sources = self.income_sources.list_income_sources(user, active_id)

        return DashboardBootstrapResponse(
            budgets=budgets,
            activeBudgetId=active_id,
            categories=categories,
            transactions=transactions,
            upcomingBills=upcoming,
            incomeSources=income_sources,
            friendsOweTotal=friends_owe,
            youOweTotal=you_owe,
        )
