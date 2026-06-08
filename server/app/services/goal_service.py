from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.utils import parse_id
from app.models.goal import Goal
from app.models.goal_contribution import GoalContribution
from app.models.user import User
from app.schemas.goal import (
    GoalContributionCreate,
    GoalContributionResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
)


class GoalService:
    def __init__(self, db: Session):
        self.db = db

    def _compute_fields(self, goal: Goal) -> dict:
        target = Decimal(goal.target_amount)
        current = Decimal(goal.current_amount)
        remaining = max(Decimal("0"), target - current)
        percent = float(min(Decimal("100"), (current / target * 100) if target > 0 else Decimal("0")))
        return {
            "percentComplete": percent,
            "remainingAmount": remaining,
            "isComplete": current >= target,
        }

    def _to_response(self, goal: Goal) -> GoalResponse:
        computed = self._compute_fields(goal)
        return GoalResponse(
            id=str(goal.id),
            name=goal.name,
            icon=goal.icon,
            targetAmount=goal.target_amount,
            currentAmount=goal.current_amount,
            targetDate=goal.target_date.isoformat() if goal.target_date else None,
            notes=goal.notes,
            isArchived=goal.is_archived,
            **computed,
        )

    def _contribution_to_response(self, contribution: GoalContribution) -> GoalContributionResponse:
        return GoalContributionResponse(
            id=str(contribution.id),
            goalId=str(contribution.goal_id),
            amount=contribution.amount,
            note=contribution.note,
            contributedAt=contribution.contributed_at.isoformat(),
        )

    def _get_owned_goal(self, user: User, goal_id_raw: str) -> Goal:
        goal_id = parse_id(goal_id_raw, label="goal id")
        goal = self.db.get(Goal, goal_id)
        if goal is None or goal.user_id != user.id:
            raise NotFoundError("Goal")
        return goal

    def _get_owned_contribution(self, goal: Goal, contribution_id_raw: str) -> GoalContribution:
        contribution_id = parse_id(contribution_id_raw, label="contribution id")
        contribution = self.db.get(GoalContribution, contribution_id)
        if contribution is None or contribution.goal_id != goal.id:
            raise NotFoundError("Contribution")
        return contribution

    def _check_name_available(self, user: User, name: str, *, exclude_goal_id: int | None = None) -> None:
        existing = self.db.scalar(select(Goal).where(Goal.user_id == user.id, Goal.name == name))
        if existing is not None and existing.id != exclude_goal_id:
            raise ConflictError("Goal already exists")

    def list_goals(self, user: User, *, include_archived: bool = False) -> list[GoalResponse]:
        query = select(Goal).where(Goal.user_id == user.id)
        if not include_archived:
            query = query.where(Goal.is_archived.is_(False))
        goals = self.db.scalars(query.order_by(Goal.created_at.desc())).all()
        return [self._to_response(g) for g in goals]

    def get_goal(self, user: User, goal_id: str) -> GoalResponse:
        return self._to_response(self._get_owned_goal(user, goal_id))

    def create_goal(self, user: User, payload: GoalCreate) -> GoalResponse:
        self._check_name_available(user, payload.name)
        if payload.current_amount > payload.target_amount:
            raise BadRequestError("Current amount cannot exceed target amount")

        goal = Goal(
            user_id=user.id,
            name=payload.name,
            icon=payload.icon,
            target_amount=payload.target_amount,
            current_amount=payload.current_amount,
            target_date=payload.target_date,
            notes=payload.notes,
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return self._to_response(goal)

    def update_goal(self, user: User, goal_id: str, payload: GoalUpdate) -> GoalResponse:
        goal = self._get_owned_goal(user, goal_id)
        data = payload.model_dump(exclude_unset=True)

        if "name" in data:
            self._check_name_available(user, data["name"], exclude_goal_id=goal.id)

        for field, value in data.items():
            setattr(goal, field, value)

        if goal.current_amount > goal.target_amount:
            raise BadRequestError("Current amount cannot exceed target amount")

        self.db.commit()
        self.db.refresh(goal)
        return self._to_response(goal)

    def delete_goal(self, user: User, goal_id: str) -> None:
        goal = self._get_owned_goal(user, goal_id)
        self.db.delete(goal)
        self.db.commit()

    def list_contributions(self, user: User, goal_id: str) -> list[GoalContributionResponse]:
        goal = self._get_owned_goal(user, goal_id)
        contributions = self.db.scalars(
            select(GoalContribution)
            .where(GoalContribution.goal_id == goal.id)
            .order_by(GoalContribution.contributed_at.desc())
        ).all()
        return [self._contribution_to_response(c) for c in contributions]

    def add_contribution(
        self, user: User, goal_id: str, payload: GoalContributionCreate
    ) -> GoalResponse:
        if payload.amount == 0:
            raise BadRequestError("Contribution amount cannot be zero")

        goal = self._get_owned_goal(user, goal_id)
        new_balance = Decimal(goal.current_amount) + Decimal(payload.amount)
        if new_balance < 0:
            raise BadRequestError("Contribution would make balance negative")

        contributed_at = payload.contributed_at or datetime.now()
        contribution = GoalContribution(
            goal_id=goal.id,
            amount=payload.amount,
            note=payload.note,
            contributed_at=contributed_at,
        )
        goal.current_amount = new_balance
        self.db.add(contribution)
        self.db.commit()
        self.db.refresh(goal)
        return self._to_response(goal)

    def delete_contribution(self, user: User, goal_id: str, contribution_id: str) -> GoalResponse:
        goal = self._get_owned_goal(user, goal_id)
        contribution = self._get_owned_contribution(goal, contribution_id)
        new_balance = Decimal(goal.current_amount) - Decimal(contribution.amount)
        if new_balance < 0:
            raise BadRequestError("Removing this contribution would make balance negative")

        goal.current_amount = new_balance
        self.db.delete(contribution)
        self.db.commit()
        self.db.refresh(goal)
        return self._to_response(goal)
