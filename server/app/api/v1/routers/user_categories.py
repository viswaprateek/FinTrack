from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.category import CategoryLibraryCreate, CategoryLibraryItem
from app.services.category_service import CategoryService
from app.services.deps import get_category_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryLibraryItem])
def list_user_categories(
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.list_user_categories(current_user)


@router.post("", response_model=CategoryLibraryItem, status_code=201)
def create_user_category(
    payload: CategoryLibraryCreate,
    current_user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
):
    return service.create_user_category(current_user, payload)
