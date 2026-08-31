from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserBrief

MessageType = Literal["text", "image", "video", "file"]
DeliveryState = Literal["sent", "delivered", "read"]


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    file_name: str
    file_size: int
    mime_type: str
    created_at: datetime


class ReplyPreview(BaseModel):
    id: UUID
    sender_id: UUID
    content: str | None
    message_type: str
    deleted: bool


class MessageCreate(BaseModel):
    content: str | None = Field(default=None, max_length=8000)
    message_type: MessageType = "text"
    reply_to_message_id: UUID | None = None
    client_id: str | None = Field(default=None, max_length=64)
    attachment_id: UUID | None = None


class MessageUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender: UserBrief | None = None
    message_type: str
    content: str | None
    reply_to_message_id: UUID | None
    reply_to: ReplyPreview | None = None
    client_id: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    edited: bool = False
    delivery_status: DeliveryState = "sent"
    attachments: list[AttachmentOut] = Field(default_factory=list)


class MessagePage(BaseModel):
    items: list[MessageOut]
    next_cursor: str | None
    has_more: bool
