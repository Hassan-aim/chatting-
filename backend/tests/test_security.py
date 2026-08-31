from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.core.password import hash_password, verify_password
from app.core.security import create_token, decode_token
from app.main import create_app
from app.utils.files import sniff_mime


def test_password_hash_roundtrip():
    hashed = hash_password("correct-horse-battery")
    assert hashed != "correct-horse-battery"
    assert verify_password("correct-horse-battery", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_types():
    user_id = uuid4()
    access = create_token(user_id, "access")
    refresh = create_token(user_id, "refresh")
    access_payload = decode_token(access, "access")
    assert access_payload["sub"] == str(user_id)
    with pytest.raises(Exception):
        decode_token(access, "refresh")
    decode_token(refresh, "refresh")


def test_file_validation_rejects_exe():
    with pytest.raises(Exception):
        sniff_mime("malware.exe", "application/octet-stream")


def test_file_validation_accepts_png():
    ext, mime = sniff_mime("photo.png", "image/png")
    assert ext == ".png"
    assert mime == "image/png"


@pytest.mark.asyncio
async def test_health():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_validation():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/auth/register",
            json={"username": "ab", "email": "bad", "password": "short"},
        )
        assert res.status_code == 422
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"


def test_settings_cors():
    settings = get_settings()
    assert isinstance(settings.cors_origin_list, list)
