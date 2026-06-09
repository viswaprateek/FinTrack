from sqlalchemy.orm import Session

from app.integrations.gemini import run_assistant_agent
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_tools import AssistantToolRunner


class AssistantService:
    def __init__(self, db: Session):
        self.db = db

    def chat(self, user: User, request: AssistantChatRequest) -> AssistantChatResponse:
        tool_runner = AssistantToolRunner(self.db, user)
        return run_assistant_agent(tool_runner, request)
