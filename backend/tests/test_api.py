"""Integration tests requiring MySQL.

Run after `docker compose up -d mysql` and `alembic upgrade head`.
"""

from __future__ import annotations

import os
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_DB_TESTS") != "1",
    reason="Set RUN_DB_TESTS=1 with a live MySQL instance",
)


async def _register(client: AsyncClient, name: str) -> dict:
    res = await client.post(
        "/api/auth/register",
        json={
            "username": name,
            "email": f"{name}@example.com",
            "password": "Password123!",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["data"]


@pytest.mark.asyncio
async def test_auth_conversation_messages_and_idor():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        suffix = uuid4().hex[:8]
        alice = await _register(client, f"alice{suffix}")
        bob = await _register(client, f"bob{suffix}")
        eve = await _register(client, f"eve{suffix}")

        alice_headers = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}
        bob_headers = {"Authorization": f"Bearer {bob['tokens']['access_token']}"}
        eve_headers = {"Authorization": f"Bearer {eve['tokens']['access_token']}"}

        me = await client.get("/api/users/me", headers=alice_headers)
        assert me.status_code == 200
        assert me.json()["data"]["username"].startswith("alice")

        conv = await client.post(
            "/api/conversations",
            headers=alice_headers,
            json={"peer_username": bob["user"]["username"]},
        )
        assert conv.status_code == 201
        conv_id = conv.json()["data"]["id"]

        forbidden = await client.get(f"/api/conversations/{conv_id}", headers=eve_headers)
        assert forbidden.status_code == 403

        sent = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_headers,
            json={"content": "hello bob", "message_type": "text", "client_id": "tmp-1"},
        )
        assert sent.status_code == 201
        msg_id = sent.json()["data"]["id"]

        history = await client.get(
            f"/api/conversations/{conv_id}/messages",
            headers=bob_headers,
        )
        assert history.status_code == 200
        assert any(m["id"] == msg_id for m in history.json()["data"])

        eve_history = await client.get(
            f"/api/conversations/{conv_id}/messages",
            headers=eve_headers,
        )
        assert eve_history.status_code == 403

        edited = await client.patch(
            f"/api/messages/{msg_id}",
            headers=alice_headers,
            json={"content": "hello bob (edited)"},
        )
        assert edited.status_code == 200
        assert edited.json()["data"]["edited"] is True

        bob_edit = await client.patch(
            f"/api/messages/{msg_id}",
            headers=bob_headers,
            json={"content": "hijack"},
        )
        assert bob_edit.status_code == 403

        deleted = await client.delete(f"/api/messages/{msg_id}", headers=alice_headers)
        assert deleted.status_code == 200
        assert deleted.json()["data"]["deleted_at"] is not None
        assert deleted.json()["data"]["content"] is None
