from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_conversation_service, get_current_user, get_message_service
from app.core.exception_handlers import success_body
from app.models import User
from app.schemas.conversation import ConversationCreate
from app.schemas.message import MessageCreate
from app.services.conversation_service import ConversationService
from app.services.message_service import MessageService
from app.websocket.handlers import manager

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(
    current: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
) -> dict:
    items = await service.list_mine(current)
    return success_body([i.model_dump(mode="json") for i in items])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
) -> dict:
    item = await service.create_direct(current, payload.peer_username)
    return success_body(item.model_dump(mode="json"))


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    current: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
) -> dict:
    item = await service.get_out(conversation_id, current.id)
    return success_body(item.model_dump(mode="json"))


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: UUID,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
) -> dict:
    page = await service.list_messages(conversation_id, current.id, cursor, limit)
    return success_body(
        [m.model_dump(mode="json") for m in page.items],
        meta={"next_cursor": page.next_cursor, "has_more": page.has_more},
    )


@router.post("/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: UUID,
    payload: MessageCreate,
    current: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
) -> dict:
    created = await service.send(conversation_id, current, payload)
    body = created.model_dump(mode="json")
    await manager.broadcast(conversation_id, "message:new", body, exclude=current.id)
    return success_body(body)
