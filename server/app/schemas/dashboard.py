from decimal import Decimal

from pydantic import BaseModel

from app.schemas.budget import BudgetResponse
from app.schemas.category import CategoryResponse
from app.schemas.income_source import IncomeSourceResponse
from app.schemas.recurring import UpcomingBillResponse
from app.schemas.transaction import TransactionResponse


class DashboardBootstrapResponse(BaseModel):
    """Single authenticated payload for the dashboard home screen."""

    budgets: list[BudgetResponse]
    activeBudgetId: str | None = None
    categories: list[CategoryResponse]
    transactions: list[TransactionResponse]
    upcomingBills: list[UpcomingBillResponse]
    incomeSources: list[IncomeSourceResponse]
    friendsOweTotal: Decimal
    youOweTotal: Decimal
