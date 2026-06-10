from sqlalchemy import func, or_

from app.models.category import Category

INCOME_ICONS = frozenset({"salary"})


def is_income_category(category: Category) -> bool:
    return (
        category.type == "income"
        or (category.icon or "") in INCOME_ICONS
        or category.name.lower() == "salary"
    )


def income_category_clause():
    """SQLAlchemy filter matching income envelopes (excluded from expense budget totals)."""
    return or_(
        Category.type == "income",
        Category.icon.in_(tuple(INCOME_ICONS)),
        func.lower(Category.name) == "salary",
    )
