from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.goal import (
    GoalContributionCreate,
    GoalContributionResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
)
from app.services.deps import get_goal_service
from app.services.goal_service import GoalService

router = APIRouter(tags=["goals"])


@router.get("/goals", response_model=list[GoalResponse])
def list_goals(
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
    include_archived: bool = Query(default=False),
):
    return service.list_goals(current_user, include_archived=include_archived)


@router.post("/goals", response_model=GoalResponse, status_code=201)
def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.create_goal(current_user, payload)


@router.get("/goals/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.get_goal(current_user, goal_id)


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.update_goal(current_user, goal_id, payload)


@router.delete("/goals/{goal_id}", status_code=204)
def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    service.delete_goal(current_user, goal_id)


@router.get("/goals/{goal_id}/contributions", response_model=list[GoalContributionResponse])
def list_contributions(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.list_contributions(current_user, goal_id)


@router.post("/goals/{goal_id}/contributions", response_model=GoalResponse)
def add_contribution(
    goal_id: str,
    payload: GoalContributionCreate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.add_contribution(current_user, goal_id, payload)


@router.delete("/goals/{goal_id}/contributions/{contribution_id}", response_model=GoalResponse)
def delete_contribution(
    goal_id: str,
    contribution_id: str,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return service.delete_contribution(current_user, goal_id, contribution_id)
