from uuid import UUID

import structlog
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models import User
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.user_repo import UserRepository
from app.schemas.message import MessageCreate, MessageUpdate
from app.services.message_service import MessageService
from app.websocket.manager import ConnectionManager

logger = structlog.get_logger(__name__)

manager = ConnectionManager()


async def _authenticate_ws(websocket: WebSocket, db: AsyncSession) -> User:
    token = websocket.query_params.get("token")
    if not token:
        auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise UnauthorizedError("Missing access token")
    payload = decode_token(token, "access")
    user = await UserRepository(db).get_by_id(UUID(payload["sub"]))
    if user is None:
        raise UnauthorizedError("User not found")
    return user


async def conversation_socket(websocket: WebSocket, conversation_id: UUID) -> None:
    async with SessionLocal() as db:
        try:
            user = await _authenticate_ws(websocket, db)
            conv_repo = ConversationRepository(db)
            if not await conv_repo.is_member(conversation_id, user.id):
                raise ForbiddenError("Not a member of this conversation")
            peer = await conv_repo.get_peer(conversation_id, user.id)
            await UserRepository(db).set_presence(user.id, True)
            delivered_ids = await MessageService(db).mark_delivered(conversation_id, user.id)
            await db.commit()
        except (UnauthorizedError, ForbiddenError) as exc:
            await websocket.close(code=4401 if isinstance(exc, UnauthorizedError) else 4403)
            return
        except Exception:
            await db.rollback()
            await websocket.close(code=1011)
            return

    user_id = user.id
    peer_id = peer.id if peer else None

    await manager.connect(conversation_id, user_id, websocket)
    await manager.broadcast(conversation_id, "presence:online", {"user_id": str(user_id)})
    if delivered_ids and peer_id:
        await manager.send_to_user(
            conversation_id,
            peer_id,
            "message:delivered",
            {"message_ids": [str(i) for i in delivered_ids]},
        )

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")
            payload = data.get("payload") or {}
            async with SessionLocal() as db:
                try:
                    await _handle_event(
                        db, websocket, conversation_id, user, peer_id, event, payload
                    )
                    await db.commit()
                except Exception:
                    await db.rollback()
                    logger.exception("ws_event_error", event=event)
                    await websocket.send_json(
                        {
                            "event": "error",
                            "payload": {"code": "EVENT_FAILED", "message": "Could not process event"},
                        }
                    )
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("ws_handler_error", conversation_id=str(conversation_id))
    finally:
        await manager.disconnect(conversation_id, user_id, websocket)
        if not manager.is_user_connected(user_id):
            async with SessionLocal() as db:
                await UserRepository(db).set_presence(user_id, False)
                await db.commit()
            await manager.broadcast(
                conversation_id, "presence:offline", {"user_id": str(user_id)}
            )


async def _handle_event(
    db: AsyncSession,
    websocket: WebSocket,
    conversation_id: UUID,
    user: User,
    peer_id: UUID | None,
    event: str | None,
    payload: dict,
) -> None:
    messages = MessageService(db)

    if event == "message:new":
        created = await messages.send(conversation_id, user, MessageCreate.model_validate(payload))
        body = created.model_dump(mode="json")
        await websocket.send_json({"event": "message:ack", "payload": body})
        await manager.broadcast(conversation_id, "message:new", body, exclude=user.id)
        if peer_id and manager.is_user_connected(peer_id):
            delivered = await messages.mark_delivered(conversation_id, peer_id)
            if delivered:
                await manager.send_to_user(
                    conversation_id,
                    user.id,
                    "message:delivered",
                    {"message_ids": [str(i) for i in delivered]},
                )
        return

    if event == "message:update":
        updated = await messages.edit(
            UUID(payload["id"]), user.id, MessageUpdate(content=payload["content"])
        )
        await manager.broadcast(conversation_id, "message:update", updated.model_dump(mode="json"))
        return

    if event == "message:delete":
        deleted = await messages.delete(UUID(payload["id"]), user.id)
        await manager.broadcast(conversation_id, "message:delete", deleted.model_dump(mode="json"))
        return

    if event == "message:read":
        ids = await messages.mark_conversation_read(conversation_id, user.id)
        if ids and peer_id:
            await manager.send_to_user(
                conversation_id,
                peer_id,
                "message:read",
                {"message_ids": [str(i) for i in ids], "reader_id": str(user.id)},
            )
        return

    if event == "typing:start":
        await manager.broadcast(
            conversation_id, "typing:start", {"user_id": str(user.id)}, exclude=user.id
        )
        return

    if event == "typing:stop":
        await manager.broadcast(
            conversation_id, "typing:stop", {"user_id": str(user.id)}, exclude=user.id
        )
        return

    await websocket.send_json(
        {"event": "error", "payload": {"code": "UNKNOWN_EVENT", "message": event}}
    )
