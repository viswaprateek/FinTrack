from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.recurring import (
    PostRecurringRuleRequest,
    RecurringRuleCreate,
    RecurringRuleResponse,
    RecurringRuleUpdate,
    UpcomingBillResponse,
)
from app.services.deps import get_recurring_service
from app.services.recurring_service import RecurringService

router = APIRouter(tags=["recurring"])


@router.get("/recurring-rules", response_model=list[RecurringRuleResponse])
def list_recurring_rules(
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
):
    return service.list_recurring_rules(current_user)


@router.get("/recurring-rules/upcoming", response_model=list[UpcomingBillResponse])
def list_upcoming_bills(
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
    days: int = Query(default=30, ge=1, le=365),
):
    return service.list_upcoming_bills(current_user, days)


@router.post("/recurring-rules", response_model=RecurringRuleResponse, status_code=201)
def create_recurring_rule(
    payload: RecurringRuleCreate,
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
):
    return service.create_recurring_rule(current_user, payload)


@router.patch("/recurring-rules/{rule_id}", response_model=RecurringRuleResponse)
def update_recurring_rule(
    rule_id: str,
    payload: RecurringRuleUpdate,
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
):
    return service.update_recurring_rule(current_user, rule_id, payload)


@router.delete("/recurring-rules/{rule_id}", status_code=204)
def delete_recurring_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
):
    service.delete_recurring_rule(current_user, rule_id)


@router.post("/recurring-rules/{rule_id}/post", response_model=RecurringRuleResponse)
def post_recurring_rule(
    rule_id: str,
    payload: PostRecurringRuleRequest,
    current_user: User = Depends(get_current_user),
    service: RecurringService = Depends(get_recurring_service),
):
    """Marks a due bill as posted: creates the transaction and advances next_due."""
    return service.post_recurring_rule(current_user, rule_id, payload)
