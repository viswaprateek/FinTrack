from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.credit_card import (
    CardTransactionCreate,
    CardTransactionResponse,
    CreditCardCreate,
    CreditCardResponse,
    CreditCardUpdate,
)
from app.services.credit_card_service import CreditCardService
from app.services.deps import get_credit_card_service

router = APIRouter(tags=["credit-cards"])


@router.get("/cards", response_model=list[CreditCardResponse])
def list_cards(
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.list_cards(current_user)


@router.post("/cards", response_model=CreditCardResponse, status_code=201)
def create_card(
    payload: CreditCardCreate,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.create_card(current_user, payload)


@router.post("/cards/seed-demo", response_model=list[CreditCardResponse])
def seed_demo_cards(
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    """Load mock demo cards with sample transactions (not connected to real accounts)."""
    return service.seed_demo_cards(current_user)


@router.get("/cards/transactions", response_model=list[CardTransactionResponse])
def list_all_transactions(
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
    limit: int = Query(default=20, ge=1, le=100),
):
    return service.list_all_transactions(current_user, limit=limit)


@router.get("/cards/{card_id}", response_model=CreditCardResponse)
def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.get_card(current_user, card_id)


@router.patch("/cards/{card_id}", response_model=CreditCardResponse)
def update_card(
    card_id: str,
    payload: CreditCardUpdate,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.update_card(current_user, card_id, payload)


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    service.delete_card(current_user, card_id)


@router.get("/cards/{card_id}/transactions", response_model=list[CardTransactionResponse])
def list_card_transactions(
    card_id: str,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.list_card_transactions(current_user, card_id)


@router.post("/cards/{card_id}/transactions", response_model=CreditCardResponse)
def add_card_transaction(
    card_id: str,
    payload: CardTransactionCreate,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    return service.add_transaction(current_user, card_id, payload)


@router.post("/cards/{card_id}/pay", response_model=CreditCardResponse)
def pay_card_balance(
    card_id: str,
    current_user: User = Depends(get_current_user),
    service: CreditCardService = Depends(get_credit_card_service),
):
    """Mock payment — resets balance to zero."""
    return service.update_card(current_user, card_id, CreditCardUpdate(current_balance=0))
