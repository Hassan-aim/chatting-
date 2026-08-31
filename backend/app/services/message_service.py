from datetime import timezone, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, ForbiddenError, NotFoundError
from app.models import DeliveryState, Message, MessageStatus, User
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.auth import UserBrief
from app.schemas.message import (
    AttachmentOut,
    MessageCreate,
    MessageOut,
    MessagePage,
    MessageUpdate,
    ReplyPreview,
)


def serialize_message(message: Message, viewer_id: UUID) -> MessageOut:
    if message.deleted_at is not None:
        return MessageOut(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            sender=UserBrief.model_validate(message.sender) if message.sender else None,
            message_type=message.message_type,
            content=None,
            reply_to_message_id=message.reply_to_message_id,
            client_id=message.client_id,
            created_at=message.created_at,
            updated_at=message.updated_at,
            deleted_at=message.deleted_at,
            edited=False,
            delivery_status=_viewer_status(message, viewer_id),
            attachments=[],
        )

    reply = None
    if message.reply_to is not None:
        reply = ReplyPreview(
            id=message.reply_to.id,
            sender_id=message.reply_to.sender_id,
            content=None if message.reply_to.deleted_at else message.reply_to.content,
            message_type=message.reply_to.message_type,
            deleted=message.reply_to.deleted_at is not None,
        )

    edited = message.updated_at.replace(microsecond=0) > message.created_at.replace(microsecond=0)
    return MessageOut(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender=UserBrief.model_validate(message.sender) if message.sender else None,
        message_type=message.message_type,
        content=message.content,
        reply_to_message_id=message.reply_to_message_id,
        reply_to=reply,
        client_id=message.client_id,
        created_at=message.created_at,
        updated_at=message.updated_at,
        deleted_at=None,
        edited=edited,
        delivery_status=_viewer_status(message, viewer_id),
        attachments=[AttachmentOut.model_validate(a) for a in message.attachments],
    )


def _viewer_status(message: Message, viewer_id: UUID) -> str:
    # Sender sees the recipient's delivery state; recipient sees their own.
    if not message.statuses:
        return DeliveryState.SENT.value
    if message.sender_id == viewer_id:
        other = next((s for s in message.statuses if s.user_id != viewer_id), message.statuses[0])
        return other.status
    own = next((s for s in message.statuses if s.user_id == viewer_id), None)
    return own.status if own else DeliveryState.SENT.value


class MessageService:
    def __init__(self, session: AsyncSession) -> None:
        self.messages = MessageRepository(session)
        self.conversations = ConversationRepository(session)

    async def list_messages(
        self, conversation_id: UUID, user_id: UUID, cursor: str | None, limit: int
    ) -> MessagePage:
        await self._require_member(conversation_id, user_id)
        before = None
        if cursor:
            try:
                before = datetime.fromisoformat(cursor)
            except ValueError as exc:
                raise AppError("INVALID_CURSOR", "Invalid pagination cursor", 400) from exc

        rows = await self.messages.list_page(conversation_id, limit=limit + 1, before=before)
        has_more = len(rows) > limit
        # Chronological window; extra oldest row (index 0) indicates older history exists.
        items = rows[1:] if has_more else rows
        next_cursor = items[0].created_at.isoformat() if has_more and items else None
        return MessagePage(
            items=[serialize_message(m, user_id) for m in items],
            next_cursor=next_cursor,
            has_more=has_more,
        )

    async def send(self, conversation_id: UUID, sender: User, payload: MessageCreate) -> MessageOut:
        await self._require_member(conversation_id, sender.id)
        if payload.message_type == "text" and not (payload.content or "").strip():
            raise AppError("EMPTY_MESSAGE", "Text messages require content", 400)

        reply_to_id = payload.reply_to_message_id
        if reply_to_id:
            parent = await self.messages.get(reply_to_id)
            if parent is None or parent.conversation_id != conversation_id:
                raise AppError("INVALID_REPLY", "Reply target is not in this conversation", 400)

        message_type = payload.message_type
        attachment = None
        if payload.attachment_id:
            attachment = await self.messages.get_attachment(payload.attachment_id)
            if attachment is None:
                raise NotFoundError("ATTACHMENT_NOT_FOUND", "Attachment not found")
            if attachment.message_id is not None:
                raise AppError("ATTACHMENT_USED", "Attachment already belongs to a message", 400)
            if attachment.uploaded_by_id != sender.id:
                raise ForbiddenError("You cannot use this attachment")
            from app.utils.files import message_type_for_mime

            message_type = message_type_for_mime(attachment.mime_type)

        message = Message(
            conversation_id=conversation_id,
            sender_id=sender.id,
            message_type=message_type,
            content=payload.content.strip() if payload.content else None,
            reply_to_message_id=reply_to_id,
            client_id=payload.client_id,
        )
        message = await self.messages.create(message)

        peer = await self.conversations.get_peer(conversation_id, sender.id)
        if peer is None:
            raise AppError("INVALID_CONVERSATION", "Conversation has no peer", 400)

        await self.messages.add_status(
            MessageStatus(
                message_id=message.id,
                user_id=peer.id,
                status=DeliveryState.SENT.value,
            )
        )
        if attachment:
            attachment.message_id = message.id
        await self.messages.touch_conversation(conversation_id)
        message = await self.messages.get(message.id)
        assert message is not None
        return serialize_message(message, sender.id)

    async def edit(self, message_id: UUID, user_id: UUID, payload: MessageUpdate) -> MessageOut:
        message = await self._get(message_id)
        if message.sender_id != user_id:
            raise ForbiddenError("You can only edit your own messages")
        if message.deleted_at is not None:
            raise AppError("MESSAGE_DELETED", "Cannot edit a deleted message", 400)
        if message.message_type != "text":
            raise AppError("NOT_EDITABLE", "Only text messages can be edited", 400)
        await self._require_member(message.conversation_id, user_id)
        message.content = payload.content.strip()
        message.updated_at = datetime.now(timezone.utc)
        await self.messages.session.flush()
        message = await self.messages.get(message.id)
        assert message is not None
        return serialize_message(message, user_id)

    async def delete(self, message_id: UUID, user_id: UUID) -> MessageOut:
        message = await self._get(message_id)
        if message.sender_id != user_id:
            raise ForbiddenError("You can only delete your own messages")
        await self._require_member(message.conversation_id, user_id)
        message.deleted_at = datetime.now(timezone.utc)
        message.content = None
        await self.messages.session.flush()
        message = await self.messages.get(message.id)
        assert message is not None
        return serialize_message(message, user_id)

    async def mark_read(self, message_id: UUID, user_id: UUID) -> list[UUID]:
        message = await self._get(message_id)
        await self._require_member(message.conversation_id, user_id)
        if message.sender_id == user_id:
            return []
        await self.messages.mark_message_read(message_id, user_id)
        return [message_id]

    async def mark_conversation_read(self, conversation_id: UUID, user_id: UUID) -> list[UUID]:
        await self._require_member(conversation_id, user_id)
        return await self.messages.mark_read(conversation_id, user_id)

    async def mark_delivered(self, conversation_id: UUID, user_id: UUID) -> list[UUID]:
        await self._require_member(conversation_id, user_id)
        return await self.messages.mark_delivered(conversation_id, user_id)

    async def _get(self, message_id: UUID) -> Message:
        message = await self.messages.get(message_id)
        if message is None:
            raise NotFoundError("MESSAGE_NOT_FOUND", "Message not found")
        return message

    async def _require_member(self, conversation_id: UUID, user_id: UUID) -> None:
        if not await self.conversations.is_member(conversation_id, user_id):
            raise ForbiddenError("You are not a member of this conversation")
