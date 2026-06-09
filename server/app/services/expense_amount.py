from decimal import Decimal

from app.models.transaction import Transaction


def friends_owed_total(transaction: Transaction) -> Decimal:
    share = getattr(transaction, "expense_share", None)
    if share is None or not share.participants:
        return Decimal("0")
    return sum((p.amount_owed for p in share.participants), Decimal("0"))


def payer_expense_amount(transaction: Transaction) -> Decimal:
    """Amount of an expense that counts toward the payer's budget (after friend splits)."""
    if transaction.type != "expense":
        return Decimal("0")
    owed = friends_owed_total(transaction)
    remaining = Decimal(transaction.amount) - owed
    return remaining if remaining > 0 else Decimal("0")


def scale_to_payer_share(transaction: Transaction, line_amount: Decimal) -> Decimal:
    """Scale a category split line to the payer's portion of the transaction."""
    if transaction.amount <= 0:
        return Decimal("0")
    payer = payer_expense_amount(transaction)
    return (Decimal(line_amount) * payer / Decimal(transaction.amount)).quantize(Decimal("0.01"))
