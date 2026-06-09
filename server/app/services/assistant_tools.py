import datetime as dt
import json
import logging
from decimal import Decimal
from typing import Any

from google.genai import types
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.transaction_service import TransactionService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

MAX_TRANSACTION_LIMIT = 20


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


def get_tool_declarations() -> list[types.Tool]:
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="get_user_profile",
                    description="Get the signed-in user's profile including default currency.",
                    parameters=types.Schema(type=types.Type.OBJECT, properties={}),
                ),
                types.FunctionDeclaration(
                    name="list_budgets",
                    description="List all budgets for the user with planned and spent totals.",
                    parameters=types.Schema(type=types.Type.OBJECT, properties={}),
                ),
                types.FunctionDeclaration(
                    name="get_budget_for_date",
                    description="Find which budget period contains a given date (YYYY-MM-DD).",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "date": types.Schema(
                                type=types.Type.STRING,
                                description="Date in YYYY-MM-DD format",
                            ),
                        },
                        required=["date"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="list_categories",
                    description="List envelope categories for a budget with planned and spent amounts.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "budget_id": types.Schema(
                                type=types.Type.STRING,
                                description="Budget ID",
                            ),
                        },
                        required=["budget_id"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="search_transactions",
                    description="Search recent transactions. Amounts are negative for expenses, positive for income.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "budget_id": types.Schema(
                                type=types.Type.STRING,
                                description="Optional budget ID filter",
                            ),
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="Optional exact category name filter",
                            ),
                            "search": types.Schema(
                                type=types.Type.STRING,
                                description="Optional text search in description",
                            ),
                            "type": types.Schema(
                                type=types.Type.STRING,
                                description="Optional filter: expense or income",
                            ),
                            "limit": types.Schema(
                                type=types.Type.INTEGER,
                                description="Max results (default 10, max 20)",
                            ),
                        },
                    ),
                ),
            ]
        )
    ]


class AssistantToolRunner:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.budgets = BudgetService(db)
        self.categories = CategoryService(db)
        self.transactions = TransactionService(db)
        self.users = UserService(db)

    def execute(self, name: str, args: dict[str, Any] | None) -> dict[str, Any]:
        args = args or {}
        try:
            if name == "get_user_profile":
                return _json_safe(self.users.get_me(self.user).model_dump())
            if name == "list_budgets":
                return {"budgets": _json_safe([b.model_dump() for b in self.budgets.list_budgets(self.user)])}
            if name == "get_budget_for_date":
                return self._get_budget_for_date(str(args.get("date", "")))
            if name == "list_categories":
                return self._list_categories(str(args.get("budget_id", "")))
            if name == "search_transactions":
                return self._search_transactions(args)
            return {"error": f"Unknown tool: {name}"}
        except Exception as exc:
            logger.warning("Assistant tool %s failed: %s", name, exc)
            return {"error": str(exc)}

    def _get_budget_for_date(self, date_raw: str) -> dict[str, Any]:
        try:
            target = dt.date.fromisoformat(date_raw[:10])
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}

        for budget in self.budgets.list_budgets(self.user):
            if budget.periodStart <= target <= budget.periodEnd:
                return {"budget": _json_safe(budget.model_dump())}
        return {"budget": None, "message": "No budget found for that date."}

    def _list_categories(self, budget_id: str) -> dict[str, Any]:
        if not budget_id:
            return {"error": "budget_id is required"}
        categories = self.categories.list_categories(self.user, budget_id)
        return {
            "categories": _json_safe(
                [
                    {
                        "id": c.id,
                        "name": c.name,
                        "planned": c.planned,
                        "spent": c.spent,
                    }
                    for c in categories
                ]
            )
        }

    def _search_transactions(self, args: dict[str, Any]) -> dict[str, Any]:
        limit = min(int(args.get("limit") or 10), MAX_TRANSACTION_LIMIT)
        tx_type = args.get("type")
        if tx_type not in (None, "expense", "income"):
            return {"error": "type must be expense or income"}

        rows = self.transactions.list_transactions(
            self.user,
            budget_id=args.get("budget_id"),
            category=args.get("category"),
            search=args.get("search"),
            type=tx_type,
        )
        return {
            "transactions": _json_safe(
                [
                    {
                        "id": t.id,
                        "date": t.date,
                        "description": t.description,
                        "category": t.category,
                        "amount": t.amount,
                        "type": "expense" if float(t.amount) < 0 else "income",
                        "account": t.account,
                    }
                    for t in rows[:limit]
                ]
            )
        }


def parse_tool_args(raw: Any) -> dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}
