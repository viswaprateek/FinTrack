from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class AssistantChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    image_base64: str | None = None
    image_mime_type: Literal["image/jpeg", "image/png"] | None = None

    @model_validator(mode="after")
    def validate_image_fields(self) -> "AssistantChatRequest":
        has_image = self.image_base64 is not None
        if has_image and not self.image_mime_type:
            raise ValueError("image_mime_type is required when image_base64 is provided")
        if not has_image and self.image_mime_type:
            raise ValueError("image_base64 is required when image_mime_type is provided")
        if has_image and len(self.image_base64 or "") > 4 * 1024 * 1024:
            raise ValueError("image_base64 exceeds 4MB limit")
        if not any(m.role == "user" for m in self.messages):
            raise ValueError("At least one user message is required")
        return self


class AssistantTransactionPayload(BaseModel):
    type: Literal["expense", "income", "unknown"] = "unknown"
    amount: float | None = None
    currency: str = "USD"
    date: str | None = None
    description: str | None = None
    account: str | None = None
    category_suggestion: str | None = None
    is_reimbursable: bool = False
    notes: str | None = None
    confidence: Literal["high", "medium", "low"] = "low"
    clarification_needed: str | None = None


class AssistantChatResponse(BaseModel):
    kind: Literal["transaction", "answer", "clarification"]
    transaction: AssistantTransactionPayload | None = None
    message: str | None = None

    @model_validator(mode="after")
    def validate_kind_payload(self) -> "AssistantChatResponse":
        if self.kind == "transaction" and self.transaction is None:
            raise ValueError("transaction is required when kind is transaction")
        if self.kind in ("answer", "clarification") and not self.message:
            raise ValueError("message is required when kind is answer or clarification")
        return self
