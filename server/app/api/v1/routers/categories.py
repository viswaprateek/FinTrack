from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, MoveFundsRequest
from app.services.category_service import CategoryService
from app.services.deps import get_category_service

router = APIRouter(prefix="/budgets/{budget_id}/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.list_categories(current_user, budget_id)


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    budget_id: str,
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.create_category(current_user, budget_id, payload)


@router.post("/move-funds", status_code=204)
def move_funds(
    budget_id: str,
    payload: MoveFundsRequest,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    """Shift planned amounts between two envelopes within the same budget and record it."""
    service.move_funds(current_user, budget_id, payload)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    budget_id: str,
    category_id: str,
    payload: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.update_category(current_user, budget_id, category_id, payload)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    budget_id: str,
    category_id: str,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    service.delete_category(current_user, budget_id, category_id)
