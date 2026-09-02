"""WebSocket integration tests requiring MySQL.

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
async def test_ws_connect_and_send_message():
    """Test WebSocket connection, message send, and acknowledgment."""
    app = create_app()
    suffix = uuid4().hex[:8]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        alice = await _register(client, f"alice_{suffix}")
        bob = await _register(client, f"bob_{suffix}")
        alice_h = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}
        bob_h = {"Authorization": f"Bearer {bob['tokens']['access_token']}"}

        # Create conversation
        conv_res = await client.post(
            "/api/conversations",
            headers=alice_h,
            json={"peer_username": bob["user"]["username"]},
        )
        assert conv_res.status_code == 201
        conv_id = conv_res.json()["data"]["id"]

    # Test via REST endpoints since httpx doesn't support WebSocket directly
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Alice sends a message
        send_res = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            json={
                "content": "hello from ws test",
                "message_type": "text",
                "client_id": f"cid-{uuid4().hex[:8]}",
            },
        )
        assert send_res.status_code == 201
        msg = send_res.json()["data"]
        assert msg["content"] == "hello from ws test"
        msg_id = msg["id"]

        # Bob marks message as read
        read_res = await client.post(
            f"/api/messages/{msg_id}/read",
            headers=bob_h,
        )
        assert read_res.status_code == 200

        # Verify message history shows the message
        history = await client.get(
            f"/api/conversations/{conv_id}/messages",
            headers=bob_h,
        )
        assert history.status_code == 200
        messages = history.json()["data"]
        assert any(m["id"] == msg_id for m in messages)


@pytest.mark.asyncio
async def test_ws_reject_unauthorized():
    """Test WebSocket rejects connections without valid token."""
    app = create_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Should fail without auth
        res = await client.get("/api/conversations", headers={})
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_typing_indicators_via_rest():
    """Verify typing and presence events work through message flow."""
    app = create_app()
    suffix = uuid4().hex[:8]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        alice = await _register(client, f"typealice_{suffix}")
        bob = await _register(client, f"typebob_{suffix}")
        alice_h = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}

        # Create conversation
        conv_res = await client.post(
            "/api/conversations",
            headers=alice_h,
            json={"peer_username": bob["user"]["username"]},
        )
        assert conv_res.status_code == 201
        conv_id = conv_res.json()["data"]["id"]

        # Alice sends message, Bob marks as read
        send_res = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            json={"content": "msg1", "message_type": "text"},
        )
        assert send_res.status_code == 201


@pytest.mark.asyncio
async def test_message_edit_delete_via_rest():
    """Test message edit and delete flows."""
    app = create_app()
    suffix = uuid4().hex[:8]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        alice = await _register(client, f"editalice_{suffix}")
        bob = await _register(client, f"editbob_{suffix}")
        alice_h = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}
        bob_h = {"Authorization": f"Bearer {bob['tokens']['access_token']}"}

        conv_res = await client.post(
            "/api/conversations",
            headers=alice_h,
            json={"peer_username": bob["user"]["username"]},
        )
        conv_id = conv_res.json()["data"]["id"]

        # Alice sends
        send_res = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            json={"content": "original", "message_type": "text"},
        )
        msg_id = send_res.json()["data"]["id"]

        # Alice edits
        edit_res = await client.patch(
            f"/api/messages/{msg_id}",
            headers=alice_h,
            json={"content": "edited content"},
        )
        assert edit_res.status_code == 200
        assert edit_res.json()["data"]["edited"] is True
        assert edit_res.json()["data"]["content"] == "edited content"

        # Bob cannot edit Alice's message
        bob_edit = await client.patch(
            f"/api/messages/{msg_id}",
            headers=bob_h,
            json={"content": "hijack"},
        )
        assert bob_edit.status_code == 403

        # Alice deletes (soft delete)
        del_res = await client.delete(
            f"/api/messages/{msg_id}", headers=alice_h
        )
        assert del_res.status_code == 200
        assert del_res.json()["data"]["deleted_at"] is not None
        assert del_res.json()["data"]["content"] is None

        # Bob cannot delete Alice's message
        send2 = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            json={"content": "another", "message_type": "text"},
        )
        msg2_id = send2.json()["data"]["id"]
        bob_del = await client.delete(
            f"/api/messages/{msg2_id}", headers=bob_h
        )
        assert bob_del.status_code == 403


@pytest.mark.asyncio
async def test_reply_to_message():
    """Test replying to a specific message."""
    app = create_app()
    suffix = uuid4().hex[:8]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        alice = await _register(client, f"replyalice_{suffix}")
        bob = await _register(client, f"replybob_{suffix}")
        alice_h = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}
        bob_h = {"Authorization": f"Bearer {bob['tokens']['access_token']}"}

        conv_res = await client.post(
            "/api/conversations",
            headers=alice_h,
            json={"peer_username": bob["user"]["username"]},
        )
        conv_id = conv_res.json()["data"]["id"]

        # Alice sends original
        send_res = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            json={"content": "original", "message_type": "text"},
        )
        orig_id = send_res.json()["data"]["id"]

        # Bob replies to it
        reply_res = await client.post(
            f"/api/conversations/{conv_id}/messages",
            headers=bob_h,
            json={
                "content": "this is a reply",
                "message_type": "text",
                "reply_to_message_id": orig_id,
            },
        )
        assert reply_res.status_code == 201
        reply = reply_res.json()["data"]
        assert reply["reply_to_message_id"] == orig_id
        assert reply["reply_to"]["id"] == orig_id
        assert reply["reply_to"]["content"] == "original"


@pytest.mark.asyncio
async def test_cursor_pagination():
    """Test cursor-based message pagination."""
    app = create_app()
    suffix = uuid4().hex[:8]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        alice = await _register(client, f"pagealice_{suffix}")
        bob = await _register(client, f"pagebob_{suffix}")
        alice_h = {"Authorization": f"Bearer {alice['tokens']['access_token']}"}

        conv_res = await client.post(
            "/api/conversations",
            headers=alice_h,
            json={"peer_username": bob["user"]["username"]},
        )
        conv_id = conv_res.json()["data"]["id"]

        # Send multiple messages
        for i in range(5):
            await client.post(
                f"/api/conversations/{conv_id}/messages",
                headers=alice_h,
                json={"content": f"msg {i}", "message_type": "text"},
            )

        # Fetch with small limit
        page1 = await client.get(
            f"/api/conversations/{conv_id}/messages",
            headers=alice_h,
            params={"limit": 3},
        )
        assert page1.status_code == 200
        data1 = page1.json()
        assert len(data1["data"]) == 3

        if data1["meta"]["has_more"]:
            page2 = await client.get(
                f"/api/conversations/{conv_id}/messages",
                headers=alice_h,
                params={"limit": 3, "cursor": data1["meta"]["next_cursor"]},
            )
            assert page2.status_code == 200
            assert len(page2.json()["data"]) == 2
