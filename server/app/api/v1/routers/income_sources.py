from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.routers._helpers import not_found, parse_id
from app.api.v1.routers.budgets import _get_owned_budget
from app.core.database import get_db
from app.models.income_source import IncomeSource
from app.models.user import User
from app.schemas.income_source import IncomeSourceCreate, IncomeSourceResponse, IncomeSourceUpdate

router = APIRouter(prefix="/budgets/{budget_id}/income-sources", tags=["income-sources"])


def _to_response(source: IncomeSource) -> IncomeSourceResponse:
    return IncomeSourceResponse(
        id=str(source.id),
        name=source.name,
        amount=source.amount,
        schedule=source.schedule,
        notes=source.notes,
    )


def _get_owned_source(db: Session, budget_id: int, source_id_raw: str) -> IncomeSource:
    source_id = parse_id(source_id_raw, label="income source id")
    source = db.get(IncomeSource, source_id)
    if source is None or source.budget_id != budget_id:
        raise not_found("Income source")
    return source


@router.get("", response_model=list[IncomeSourceResponse])
def list_income_sources(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    sources = db.scalars(select(IncomeSource).where(IncomeSource.budget_id == budget.id)).all()
    return [_to_response(s) for s in sources]


@router.post("", response_model=IncomeSourceResponse, status_code=201)
def create_income_source(
    budget_id: str,
    payload: IncomeSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    source = IncomeSource(budget_id=budget.id, **payload.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return _to_response(source)


@router.patch("/{source_id}", response_model=IncomeSourceResponse)
def update_income_source(
    budget_id: str,
    source_id: str,
    payload: IncomeSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    source = _get_owned_source(db, budget.id, source_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(source, field, value)
    db.commit()
    db.refresh(source)
    return _to_response(source)


@router.delete("/{source_id}", status_code=204)
def delete_income_source(
    budget_id: str,
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _get_owned_budget(db, current_user, budget_id)
    source = _get_owned_source(db, budget.id, source_id)
    db.delete(source)
    db.commit()
