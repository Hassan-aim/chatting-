"""In-process connection manager.

Connections are keyed by conversation and user so fan-out stays scoped.
For multiple FastAPI workers, replace the broadcast path with Redis Pub/Sub
without changing the event contract used by clients.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any
from uuid import UUID

import structlog
from fastapi import WebSocket
from starlette.websockets import WebSocketState

logger = structlog.get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._by_conversation: dict[UUID, dict[UUID, set[WebSocket]]] = defaultdict(
            lambda: defaultdict(set)
        )
        self._user_sockets: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, conversation_id: UUID, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._by_conversation[conversation_id][user_id].add(websocket)
            self._user_sockets[user_id].add(websocket)
        logger.info(
            "ws_connected",
            conversation_id=str(conversation_id),
            user_id=str(user_id),
        )

    async def disconnect(self, conversation_id: UUID, user_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._by_conversation.get(conversation_id, {}).get(user_id)
            if sockets and websocket in sockets:
                sockets.remove(websocket)
                if not sockets:
                    self._by_conversation[conversation_id].pop(user_id, None)
            if not self._by_conversation.get(conversation_id):
                self._by_conversation.pop(conversation_id, None)
            user_set = self._user_sockets.get(user_id)
            if user_set and websocket in user_set:
                user_set.remove(websocket)
            if user_set is not None and not user_set:
                self._user_sockets.pop(user_id, None)
        logger.info("ws_disconnected", conversation_id=str(conversation_id), user_id=str(user_id))

    def is_user_connected(self, user_id: UUID) -> bool:
        return bool(self._user_sockets.get(user_id))

    async def send_to_user(
        self, conversation_id: UUID, user_id: UUID, event: str, payload: dict[str, Any]
    ) -> None:
        async with self._lock:
            sockets = list(self._by_conversation.get(conversation_id, {}).get(user_id, set()))
        await self._emit(sockets, event, payload)

    async def broadcast(
        self, conversation_id: UUID, event: str, payload: dict[str, Any], exclude: UUID | None = None
    ) -> None:
        async with self._lock:
            sockets: list[WebSocket] = []
            for uid, sock_set in self._by_conversation.get(conversation_id, {}).items():
                if exclude is not None and uid == exclude:
                    continue
                sockets.extend(sock_set)
        await self._emit(sockets, event, payload)

    async def send_to_user_all(self, user_id: UUID, event: str, payload: dict[str, Any]) -> None:
        async with self._lock:
            sockets = list(self._user_sockets.get(user_id, set()))
        await self._emit(sockets, event, payload)

    async def _emit(self, sockets: list[WebSocket], event: str, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        message = {"event": event, "payload": payload}
        for ws in sockets:
            if ws.client_state != WebSocketState.CONNECTED:
                stale.append(ws)
                continue
            try:
                await ws.send_json(message)
            except Exception:
                logger.warning("ws_send_failed", event=event)
                stale.append(ws)
        if stale:
            async with self._lock:
                for conv_map in self._by_conversation.values():
                    for sock_set in conv_map.values():
                        sock_set.difference_update(stale)
                for sock_set in self._user_sockets.values():
                    sock_set.difference_update(stale)
