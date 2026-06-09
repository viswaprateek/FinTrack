from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(UserBase):
    clerk_user_id: str


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str


class UserPreferencesUpdate(BaseModel):
    default_currency: str | None = None


class UserResponse(BaseModel):
    """Shape expected by the frontend's `MeResponse` (client/src/api/endpoints/users.ts)."""

    user_id: int
    clerk_user_id: str
    email: str
    first_name: str | None = None
    default_currency: str
    onboardingCompleted: bool
