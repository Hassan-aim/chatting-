from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserBrief


class ConversationCreate(BaseModel):
    peer_username: str = Field(min_length=3, max_length=32)


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    peer: UserBrief
    last_message_preview: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
