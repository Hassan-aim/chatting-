from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models import User
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.services.conversation_service import ConversationService
from app.services.message_service import MessageService
from app.services.storage import StorageService, build_storage
from app.services.upload_service import UploadService

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise UnauthorizedError("Not authenticated")
    payload = decode_token(creds.credentials, "access")
    user = await UserRepository(db).get_by_id(UUID(payload["sub"]))
    if user is None:
        raise UnauthorizedError("User not found")
    return user


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


def get_message_service(db: AsyncSession = Depends(get_db)) -> MessageService:
    return MessageService(db)


_storage: StorageService | None = None


def get_storage() -> StorageService:
    global _storage
    if _storage is None:
        _storage = build_storage()
    return _storage


def get_upload_service(
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
) -> UploadService:
    return UploadService(db, storage)
