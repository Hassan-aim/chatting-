from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.models import Attachment
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.services.storage import StorageService
from app.utils.files import assert_size, sniff_mime


class UploadService:
    def __init__(self, session: AsyncSession, storage: StorageService) -> None:
        self.messages = MessageRepository(session)
        self.conversations = ConversationRepository(session)
        self.storage = storage

    async def store_pending(
        self,
        user_id: UUID,
        conversation_id: UUID,
        filename: str,
        declared_mime: str | None,
        size: int,
        stream: AsyncIterator[bytes],
    ) -> Attachment:
        if not await self.conversations.is_member(conversation_id, user_id):
            raise ForbiddenError("You are not a member of this conversation")
        assert_size(size)
        ext, mime = sniff_mime(filename, declared_mime)

        total = 0

        async def limited() -> AsyncIterator[bytes]:
            nonlocal total
            async for chunk in stream:
                total += len(chunk)
                assert_size(total)
                yield chunk

        key = await self.storage.save_stream(limited(), suffix=ext)
        attachment = await self.messages.add_attachment(
            Attachment(
                message_id=None,
                uploaded_by_id=user_id,
                file_name=filename,
                file_size=total or size,
                mime_type=mime,
                storage_key=key,
            )
        )
        return attachment

    async def get_authorized(self, attachment_id: UUID, user_id: UUID) -> Attachment:
        attachment = await self.messages.get_attachment(attachment_id)
        if attachment is None:
            raise NotFoundError("ATTACHMENT_NOT_FOUND", "Attachment not found")
        if attachment.message_id is None:
            raise ForbiddenError("You cannot access this file")
        message = await self.messages.get(attachment.message_id)
        if message is None:
            raise NotFoundError("MESSAGE_NOT_FOUND", "Message not found")
        if not await self.conversations.is_member(message.conversation_id, user_id):
            raise ForbiddenError("You cannot access this file")
        if message.deleted_at is not None:
            raise ForbiddenError("This file is no longer available")
        return attachment
