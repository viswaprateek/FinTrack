from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.income_source import IncomeSourceCreate, IncomeSourceResponse, IncomeSourceUpdate
from app.services.deps import get_income_source_service
from app.services.income_source_service import IncomeSourceService

router = APIRouter(prefix="/budgets/{budget_id}/income-sources", tags=["income-sources"])


@router.get("", response_model=list[IncomeSourceResponse])
def list_income_sources(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    service: IncomeSourceService = Depends(get_income_source_service),
):
    return service.list_income_sources(current_user, budget_id)


@router.post("", response_model=IncomeSourceResponse, status_code=201)
def create_income_source(
    budget_id: str,
    payload: IncomeSourceCreate,
    current_user: User = Depends(get_current_user),
    service: IncomeSourceService = Depends(get_income_source_service),
):
    return service.create_income_source(current_user, budget_id, payload)


@router.patch("/{source_id}", response_model=IncomeSourceResponse)
def update_income_source(
    budget_id: str,
    source_id: str,
    payload: IncomeSourceUpdate,
    current_user: User = Depends(get_current_user),
    service: IncomeSourceService = Depends(get_income_source_service),
):
    return service.update_income_source(current_user, budget_id, source_id, payload)


@router.delete("/{source_id}", status_code=204)
def delete_income_source(
    budget_id: str,
    source_id: str,
    current_user: User = Depends(get_current_user),
    service: IncomeSourceService = Depends(get_income_source_service),
):
    service.delete_income_source(current_user, budget_id, source_id)
