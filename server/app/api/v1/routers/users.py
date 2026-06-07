from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserPreferencesUpdate, UserResponse
from app.services.deps import get_user_service
from app.services.user_service import UserService

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_me(current_user)


@router.patch("/me/preferences", response_model=UserResponse)
def update_preferences(
    payload: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.update_preferences(current_user, payload)
