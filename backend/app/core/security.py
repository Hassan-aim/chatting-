from datetime import timezone, datetime, timedelta
from typing import Any, Literal
from uuid import UUID

from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.errors import UnauthorizedError

TokenType = Literal["access", "refresh"]


def create_token(
    subject: UUID,
    token_type: TokenType,
    extra: dict[str, Any] | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    if token_type == "access":
        expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    else:
        expire = now + timedelta(days=settings.jwt_refresh_token_expire_days)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": extra.pop("jti") if extra and "jti" in extra else None,
    }
    if extra:
        payload.update(extra)
    payload = {k: v for k, v in payload.items() if v is not None}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc

    if payload.get("type") != expected_type:
        raise UnauthorizedError("Invalid token type")
    if not payload.get("sub"):
        raise UnauthorizedError("Invalid token subject")
    return payload
