import datetime as dt

from pydantic import BaseModel


class ActivityDay(BaseModel):
    date: dt.date
    count: int
    level: int


class ActivityStats(BaseModel):
    activeDays: int
    totalExpenses: int
    currentStreak: int
    longestStreak: int


class ActivityResponse(BaseModel):
    days: list[ActivityDay]
    stats: ActivityStats
