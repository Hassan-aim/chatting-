from fastapi import APIRouter, Depends, Request, status

from app.api.deps import get_auth_service, get_current_user
from app.core.errors import RateLimitError
from app.core.exception_handlers import success_body
from app.middleware.rate_limit import login_limiter
from app.models import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    user, tokens = await service.register(payload)
    return success_body({"user": user.model_dump(mode="json"), "tokens": tokens.model_dump()})


@router.post("/login")
async def login(
    request: Request,
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    if not login_limiter.allow(request.client.host if request.client else "unknown"):
        raise RateLimitError("Too many login attempts from this address")
    user, tokens = await service.login(payload)
    return success_body({"user": user.model_dump(mode="json"), "tokens": tokens.model_dump()})


@router.post("/refresh")
async def refresh(
    payload: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    tokens = await service.refresh(payload.refresh_token)
    return success_body(tokens.model_dump())


@router.post("/logout")
async def logout(
    payload: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
    _: User = Depends(get_current_user),
) -> dict:
    await service.logout(payload.refresh_token)
    return success_body({"ok": True})
