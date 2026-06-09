from sqlalchemy.orm import Session

from app.core.constants import SUPPORTED_CURRENCIES
from app.core.exceptions import BadRequestError
from app.models.user import User
from app.schemas.user import UserPreferencesUpdate, UserResponse


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_me(self, user: User) -> UserResponse:
        return UserResponse(
            user_id=user.id,
            clerk_user_id=user.clerk_user_id,
            email=user.email,
            first_name=user.first_name,
            default_currency=user.default_currency,
            shareRemindersEnabled=user.share_reminders_enabled,
            onboardingCompleted=user.onboarding_completed_at is not None,
        )

    def update_preferences(self, user: User, payload: UserPreferencesUpdate) -> UserResponse:
        if payload.default_currency is not None:
            code = payload.default_currency.upper()
            if code not in SUPPORTED_CURRENCIES:
                raise BadRequestError(f"Unsupported currency: {payload.default_currency}")
            user.default_currency = code

        if payload.share_reminders_enabled is not None:
            user.share_reminders_enabled = payload.share_reminders_enabled

        self.db.commit()
        self.db.refresh(user)
        return self.get_me(user)
