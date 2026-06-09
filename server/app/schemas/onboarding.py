from pydantic import BaseModel


class OnboardingCompleteRequest(BaseModel):
    seed_demo: bool = False
    default_currency: str | None = None


class OnboardingCompleteResponse(BaseModel):
    onboardingCompleted: bool
    seededDemo: bool
