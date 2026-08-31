from datetime import timezone, datetime, timedelta
from hashlib import sha256
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ConflictError, RateLimitError, UnauthorizedError
from app.core.password import hash_password, verify_password
from app.core.security import create_token, decode_token
from app.models import RefreshToken, User
from app.repositories.user_repo import (
    LoginAttemptRepository,
    RefreshTokenRepository,
    UserRepository,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic


def _hash_token(raw: str) -> str:
    return sha256(raw.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.users = UserRepository(session)
        self.tokens = RefreshTokenRepository(session)
        self.attempts = LoginAttemptRepository(session)
        self.settings = get_settings()

    async def register(self, payload: RegisterRequest) -> tuple[UserPublic, TokenResponse]:
        if await self.users.get_by_email(payload.email.lower()):
            raise ConflictError("EMAIL_TAKEN", "Email is already registered")
        if await self.users.get_by_username(payload.username):
            raise ConflictError("USERNAME_TAKEN", "Username is already taken")

        user = User(
            username=payload.username,
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
        )
        user = await self.users.create(user)
        tokens = await self._issue_tokens(user.id)
        return UserPublic.model_validate(user), tokens

    async def login(self, payload: LoginRequest) -> tuple[UserPublic, TokenResponse]:
        identifier = payload.email.lower()
        await self._assert_not_locked(identifier)

        user = await self.users.get_by_email(identifier)
        if user is None or not verify_password(payload.password, user.password_hash):
            await self._record_failure(identifier)
            raise UnauthorizedError("Invalid email or password")

        await self._clear_failures(identifier)
        tokens = await self._issue_tokens(user.id)
        return UserPublic.model_validate(user), tokens

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token, "refresh")
        stored = await self.tokens.get_by_hash(_hash_token(refresh_token))
        now = datetime.now(timezone.utc)
        if stored is None or stored.revoked_at is not None or stored.expires_at < now:
            raise UnauthorizedError("Refresh token is invalid")
        if str(stored.user_id) != payload["sub"]:
            raise UnauthorizedError("Refresh token is invalid")

        stored.revoked_at = now
        tokens = await self._issue_tokens(stored.user_id)
        new_hash = _hash_token(tokens.refresh_token)
        replacement = await self.tokens.get_by_hash(new_hash)
        if replacement:
            stored.replaced_by_id = replacement.id
        return tokens

    async def logout(self, refresh_token: str) -> None:
        stored = await self.tokens.get_by_hash(_hash_token(refresh_token))
        if stored and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)

    async def logout_all(self, user_id: UUID) -> None:
        await self.tokens.revoke_all_for_user(user_id)

    async def _issue_tokens(self, user_id: UUID) -> TokenResponse:
        jti = str(uuid4())
        access = create_token(user_id, "access")
        refresh = create_token(user_id, "refresh", extra={"jti": jti})
        await self.tokens.create(
            RefreshToken(
                user_id=user_id,
                token_hash=_hash_token(refresh),
                expires_at=datetime.now(timezone.utc)
                + timedelta(days=self.settings.jwt_refresh_token_expire_days),
            )
        )
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=self.settings.jwt_access_token_expire_minutes * 60,
        )

    async def _assert_not_locked(self, identifier: str) -> None:
        attempt = await self.attempts.get(identifier)
        if attempt and attempt.locked_until and attempt.locked_until > datetime.now(timezone.utc):
            raise RateLimitError("Account temporarily locked due to failed login attempts")

    async def _record_failure(self, identifier: str) -> None:
        attempt = await self.attempts.upsert(identifier)
        attempt.failed_count += 1
        if attempt.failed_count >= self.settings.login_max_attempts:
            attempt.locked_until = datetime.now(timezone.utc) + timedelta(
                seconds=self.settings.login_lockout_seconds
            )

    async def _clear_failures(self, identifier: str) -> None:
        attempt = await self.attempts.get(identifier)
        if attempt:
            attempt.failed_count = 0
            attempt.locked_until = None
