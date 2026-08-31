from uuid import UUID

from fastapi import APIRouter, WebSocket

from app.websocket.handlers import conversation_socket

router = APIRouter()


@router.websocket("/ws/conversations/{conversation_id}")
async def ws_conversation(websocket: WebSocket, conversation_id: UUID) -> None:
    await conversation_socket(websocket, conversation_id)
