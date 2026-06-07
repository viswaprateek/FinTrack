from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.core.utils import parse_id
from app.models.income_source import IncomeSource
from app.models.user import User
from app.schemas.income_source import IncomeSourceCreate, IncomeSourceResponse, IncomeSourceUpdate
from app.services.budget_service import BudgetService


class IncomeSourceService:
    def __init__(self, db: Session):
        self.db = db
        self.budgets = BudgetService(db)

    def _to_response(self, source: IncomeSource) -> IncomeSourceResponse:
        return IncomeSourceResponse(
            id=str(source.id),
            name=source.name,
            amount=source.amount,
            schedule=source.schedule,
            notes=source.notes,
        )

    def _get_owned_source(self, budget_id: int, source_id_raw: str) -> IncomeSource:
        source_id = parse_id(source_id_raw, label="income source id")
        source = self.db.get(IncomeSource, source_id)
        if source is None or source.budget_id != budget_id:
            raise NotFoundError("Income source")
        return source

    def list_income_sources(self, user: User, budget_id: str) -> list[IncomeSourceResponse]:
        budget = self.budgets.get_owned_budget(user, budget_id)
        sources = self.db.scalars(select(IncomeSource).where(IncomeSource.budget_id == budget.id)).all()
        return [self._to_response(s) for s in sources]

    def create_income_source(
        self, user: User, budget_id: str, payload: IncomeSourceCreate
    ) -> IncomeSourceResponse:
        budget = self.budgets.get_owned_budget(user, budget_id)
        source = IncomeSource(budget_id=budget.id, **payload.model_dump())
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return self._to_response(source)

    def update_income_source(
        self, user: User, budget_id: str, source_id: str, payload: IncomeSourceUpdate
    ) -> IncomeSourceResponse:
        budget = self.budgets.get_owned_budget(user, budget_id)
        source = self._get_owned_source(budget.id, source_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(source, field, value)
        self.db.commit()
        self.db.refresh(source)
        return self._to_response(source)

    def delete_income_source(self, user: User, budget_id: str, source_id: str) -> None:
        budget = self.budgets.get_owned_budget(user, budget_id)
        source = self._get_owned_source(budget.id, source_id)
        self.db.delete(source)
        self.db.commit()
