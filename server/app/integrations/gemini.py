import base64
import datetime as dt
import json
import logging
import re

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import AppError
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, AssistantTransactionPayload
from app.services.assistant_tools import AssistantToolRunner, get_tool_declarations, parse_tool_args

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5

SYSTEM_PROMPT = """You are a smart financial assistant for a personal budgeting app.

You have tools to fetch the signed-in user's real data: profile, budgets, categories, and transactions.
Always call tools when you need user-specific context before answering questions or suggesting categories.

## When the user is logging a transaction
Bank SMS, UPI notification, voice transcription, natural language spend/income, or an uploaded receipt image.

1. Use tools to fetch the user's categories and default currency.
2. `category_suggestion` MUST match one of the user's actual category names from `list_categories`.
3. Return a final JSON object with kind "transaction" or "clarification".

## When the user asks a question
Spending totals, budget remaining, category breakdowns, etc.

1. Use tools to fetch the relevant data.
2. Compute the answer from real data — never guess.
3. Return a final JSON object with kind "answer".

## Final response format
After using tools as needed, respond with ONLY a JSON object (no markdown, no backticks):

{
  "kind": "transaction" | "answer" | "clarification",
  "transaction": { ... } | null,
  "message": string | null
}

For kind "transaction", transaction object fields:
{
  "type": "expense" | "income" | "unknown",
  "amount": number | null,
  "currency": string,
  "date": "YYYY-MM-DD" | null,
  "description": string | null,
  "account": string | null,
  "category_suggestion": string | null,
  "is_reimbursable": boolean,
  "notes": string | null,
  "confidence": "high" | "medium" | "low",
  "clarification_needed": string | null
}

For kind "clarification", set message to ONE follow-up question and transaction to null.
For kind "answer", set message to a helpful plain-text answer and transaction to null.

Rules:
- If date is missing for a transaction, use today's date.
- If amount is missing, use kind "clarification".
- If type is unclear, use kind "clarification".
- Default currency from get_user_profile when not specified.
"""


def _strip_code_fences(raw: str) -> str:
    trimmed = raw.strip()
    match = re.match(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed, re.IGNORECASE)
    return match.group(1).strip() if match else trimmed


def _parse_final_response(raw: str) -> AssistantChatResponse | None:
    try:
        cleaned = _strip_code_fences(raw)
        parsed = json.loads(cleaned)
        if not isinstance(parsed, dict):
            return None

        kind = parsed.get("kind")
        if kind == "transaction":
            tx_data = parsed.get("transaction")
            if not isinstance(tx_data, dict):
                return None
            return AssistantChatResponse(
                kind="transaction",
                transaction=AssistantTransactionPayload.model_validate(tx_data),
            )
        if kind == "answer":
            message = parsed.get("message")
            if not isinstance(message, str) or not message.strip():
                return None
            return AssistantChatResponse(kind="answer", message=message.strip())
        if kind == "clarification":
            message = parsed.get("message") or parsed.get("clarification_needed")
            if not isinstance(message, str) or not message.strip():
                return None
            return AssistantChatResponse(kind="clarification", message=message.strip())
        return None
    except Exception:
        return None


def _build_contents(request: AssistantChatRequest) -> list[types.Content]:
    contents: list[types.Content] = []
    last_index = len(request.messages) - 1

    for index, message in enumerate(request.messages):
        role = "user" if message.role == "user" else "model"
        parts: list[types.Part] = [types.Part.from_text(text=message.content)]

        if (
            index == last_index
            and message.role == "user"
            and request.image_base64
            and request.image_mime_type
        ):
            parts.append(
                types.Part(
                    inline_data=types.Blob(
                        mime_type=request.image_mime_type,
                        data=base64.b64decode(request.image_base64),
                    )
                )
            )
            parts.append(types.Part.from_text(text="Extract transaction details from this image."))

        contents.append(types.Content(role=role, parts=parts))

    return contents


def _extract_function_calls(response: types.GenerateContentResponse) -> list[types.FunctionCall]:
    calls: list[types.FunctionCall] = []
    if not response.candidates:
        return calls
    for part in response.candidates[0].content.parts or []:
        if part.function_call:
            calls.append(part.function_call)
    return calls


def _extract_text(response: types.GenerateContentResponse) -> str | None:
    if not response.candidates:
        return None
    texts: list[str] = []
    for part in response.candidates[0].content.parts or []:
        if part.text:
            texts.append(part.text)
    return "\n".join(texts).strip() if texts else None


def run_assistant_agent(tool_runner: AssistantToolRunner, request: AssistantChatRequest) -> AssistantChatResponse:
    if not settings.GEMINI_API_KEY:
        raise AppError("Assistant is not configured. Missing Gemini API key.", status_code=503)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    today = dt.date.today().isoformat()
    system_instruction = f"{SYSTEM_PROMPT}\n\nToday's date is {today}."

    contents = _build_contents(request)
    tools = get_tool_declarations()

    for _ in range(MAX_TOOL_ROUNDS + 1):
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )

        function_calls = _extract_function_calls(response)
        if not function_calls:
            text = _extract_text(response)
            if not text:
                break
            parsed = _parse_final_response(text)
            if parsed:
                return parsed
            return AssistantChatResponse(
                kind="clarification",
                message="Sorry, I couldn't understand that. Try rephrasing or uploading a clearer image.",
            )

        if not response.candidates or not response.candidates[0].content:
            break

        contents.append(response.candidates[0].content)

        response_parts: list[types.Part] = []
        for call in function_calls:
            name = call.name or ""
            args = parse_tool_args(call.args)
            result = tool_runner.execute(name, args)
            response_parts.append(
                types.Part.from_function_response(
                    name=name,
                    response=result,
                )
            )
        contents.append(types.Content(role="user", parts=response_parts))

    return AssistantChatResponse(
        kind="clarification",
        message="Sorry, I couldn't complete that request. Please try again.",
    )
