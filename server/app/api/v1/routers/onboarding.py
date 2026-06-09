from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.onboarding import OnboardingCompleteRequest, OnboardingCompleteResponse
from app.services.deps import get_onboarding_service
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/complete", response_model=OnboardingCompleteResponse)
def complete_onboarding(
    payload: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    return service.complete_onboarding(
        current_user,
        seed_demo=payload.seed_demo,
        default_currency=payload.default_currency,
    )
