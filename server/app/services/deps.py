from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.credit_card_service import CreditCardService
from app.services.goal_service import GoalService
from app.services.income_source_service import IncomeSourceService
from app.services.recurring_service import RecurringService
from app.services.transaction_service import TransactionService
from app.services.user_service import UserService


def get_budget_service(db: Session = Depends(get_db)) -> BudgetService:
    return BudgetService(db)


def get_category_service(db: Session = Depends(get_db)) -> CategoryService:
    return CategoryService(db)


def get_income_source_service(db: Session = Depends(get_db)) -> IncomeSourceService:
    return IncomeSourceService(db)


def get_transaction_service(db: Session = Depends(get_db)) -> TransactionService:
    return TransactionService(db)


def get_recurring_service(db: Session = Depends(get_db)) -> RecurringService:
    return RecurringService(db)


def get_goal_service(db: Session = Depends(get_db)) -> GoalService:
    return GoalService(db)


def get_credit_card_service(db: Session = Depends(get_db)) -> CreditCardService:
    return CreditCardService(db)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)
