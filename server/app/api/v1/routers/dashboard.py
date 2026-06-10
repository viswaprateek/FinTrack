from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardBootstrapResponse
from app.services.dashboard_service import DashboardService
from app.services.deps import get_dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardBootstrapResponse)
def get_dashboard_bootstrap(
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
    budget_id: str | None = Query(default=None),
):
    return service.get_bootstrap(current_user, budget_id=budget_id)
