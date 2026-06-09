import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.activity import ActivityDay, ActivityResponse, ActivityStats

LOOKBACK_DAYS = 364


def _level_for_count(count: int) -> int:
    if count <= 0:
        return 0
    if count == 1:
        return 1
    if count <= 3:
        return 2
    if count <= 6:
        return 3
    return 4


def _compute_streaks(active_dates: set[dt.date], today: dt.date) -> tuple[int, int]:
    if not active_dates:
        return 0, 0

    sorted_dates = sorted(active_dates)
    longest = 1
    run = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    current = 0
    cursor = today
    if cursor not in active_dates:
        cursor -= dt.timedelta(days=1)
    while cursor in active_dates:
        current += 1
        cursor -= dt.timedelta(days=1)

    return current, longest


class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def get_expense_activity(self, user: User, *, days: int = LOOKBACK_DAYS) -> ActivityResponse:
        today = dt.date.today()
        start = today - dt.timedelta(days=days)

        rows = self.db.execute(
            select(Transaction.date, func.count(Transaction.id))
            .join(Budget, Transaction.budget_id == Budget.id)
            .where(
                Budget.user_id == user.id,
                Transaction.type == "expense",
                Transaction.date >= start,
                Transaction.date <= today,
            )
            .group_by(Transaction.date)
            .order_by(Transaction.date)
        ).all()

        count_by_date: dict[dt.date, int] = {row[0]: int(row[1]) for row in rows}
        active_dates = set(count_by_date.keys())
        total_expenses = sum(count_by_date.values())

        activity_days = [
            ActivityDay(date=d, count=count_by_date[d], level=_level_for_count(count_by_date[d]))
            for d in sorted(active_dates)
        ]

        current_streak, longest_streak = _compute_streaks(active_dates, today)

        return ActivityResponse(
            days=activity_days,
            stats=ActivityStats(
                activeDays=len(active_dates),
                totalExpenses=total_expenses,
                currentStreak=current_streak,
                longestStreak=longest_streak,
            ),
        )
