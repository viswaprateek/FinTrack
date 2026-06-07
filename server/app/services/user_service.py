from app.models.user import User
from app.schemas.user import UserResponse


class UserService:
    def get_me(self, user: User) -> UserResponse:
        return UserResponse(
            user_id=user.id,
            clerk_user_id=user.clerk_user_id,
            email=user.email,
            first_name=user.first_name,
        )
