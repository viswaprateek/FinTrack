from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.services.budget_service import BudgetService
from app.services.deps import get_budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return service.list_budgets(current_user)


@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return service.create_budget(current_user, payload)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return service.get_budget(current_user, budget_id)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    return service.update_budget(current_user, budget_id, payload)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    service: BudgetService = Depends(get_budget_service),
):
    service.delete_budget(current_user, budget_id)
