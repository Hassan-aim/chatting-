"""Shared test fixtures for backend tests."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture()
def app():
    """Create a fresh FastAPI app for each test."""
    return create_app()


@pytest.fixture()
async def client(app):
    """Provide an async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


async def register_user(
    client: AsyncClient, name: str | None = None
) -> dict:
    """Register a user and return the full response data (user + tokens)."""
    name = name or f"user_{uuid4().hex[:8]}"
    res = await client.post(
        "/api/auth/register",
        json={
            "username": name,
            "email": f"{name}@example.com",
            "password": "TestPassword123!",
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    return data


def auth_headers(data: dict) -> dict[str, str]:
    """Extract authorization headers from register/login response."""
    return {"Authorization": f"Bearer {data['tokens']['access_token']}"}


async def create_pair(
    client: AsyncClient,
) -> tuple[dict, dict, dict[str, str], dict[str, str], str]:
    """Register two users and create a conversation between them.

    Returns (alice_data, bob_data, alice_headers, bob_headers, conversation_id).
    """
    alice = await register_user(client)
    bob = await register_user(client)
    alice_h = auth_headers(alice)
    bob_h = auth_headers(bob)

    conv_res = await client.post(
        "/api/conversations",
        headers=alice_h,
        json={"peer_username": bob["user"]["username"]},
    )
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["data"]["id"]
    return alice, bob, alice_h, bob_h, conv_id
