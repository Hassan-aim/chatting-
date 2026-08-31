from datetime import timezone, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LoginAttempt, RefreshToken, User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def set_presence(self, user_id: UUID, online: bool) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            return
        user.is_online = online
        if not online:
            user.last_seen = datetime.now(timezone.utc)
        await self.session.flush()


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        now = datetime.now(timezone.utc)
        for token in result.scalars():
            token.revoked_at = now
        await self.session.flush()


class LoginAttemptRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, identifier: str) -> LoginAttempt | None:
        result = await self.session.execute(
            select(LoginAttempt).where(LoginAttempt.identifier == identifier)
        )
        return result.scalar_one_or_none()

    async def upsert(self, identifier: str) -> LoginAttempt:
        attempt = await self.get(identifier)
        if attempt is None:
            attempt = LoginAttempt(identifier=identifier)
            self.session.add(attempt)
            await self.session.flush()
        return attempt
