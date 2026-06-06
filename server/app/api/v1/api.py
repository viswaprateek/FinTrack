from fastapi import APIRouter

from app.api.v1.routers import (
    budgets,
    categories,
    health,
    income_sources,
    recurring,
    transactions,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(budgets.router)
api_router.include_router(categories.router)
api_router.include_router(income_sources.router)
api_router.include_router(transactions.router)
api_router.include_router(recurring.router)
