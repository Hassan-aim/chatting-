from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_message_service
from app.core.exception_handlers import success_body
from app.models import User
from app.schemas.message import MessageUpdate
from app.services.message_service import MessageService
from app.websocket.handlers import manager

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.patch("/{message_id}")
async def edit_message(
    message_id: UUID,
    payload: MessageUpdate,
    current: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
) -> dict:
    updated = await service.edit(message_id, current.id, payload)
    body = updated.model_dump(mode="json")
    await manager.broadcast(updated.conversation_id, "message:update", body)
    return success_body(body)


@router.delete("/{message_id}")
async def delete_message(
    message_id: UUID,
    current: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
) -> dict:
    deleted = await service.delete(message_id, current.id)
    body = deleted.model_dump(mode="json")
    await manager.broadcast(deleted.conversation_id, "message:delete", body)
    return success_body(body)


@router.post("/{message_id}/read")
async def read_message(
    message_id: UUID,
    current: User = Depends(get_current_user),
    service: MessageService = Depends(get_message_service),
) -> dict:
    ids = await service.mark_read(message_id, current.id)
    return success_body({"message_ids": [str(i) for i in ids]})
