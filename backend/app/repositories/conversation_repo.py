from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Conversation, ConversationMember, ConversationPair, Message, User


class ConversationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, conversation_id: UUID) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
            .where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_pair(self, user_a: UUID, user_b: UUID) -> ConversationPair | None:
        low, high = (user_a, user_b) if user_a < user_b else (user_b, user_a)
        result = await self.session.execute(
            select(ConversationPair).where(
                ConversationPair.user_low_id == low,
                ConversationPair.user_high_id == high,
            )
        )
        return result.scalar_one_or_none()

    async def is_member(self, conversation_id: UUID, user_id: UUID) -> bool:
        result = await self.session.execute(
            select(ConversationMember.id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_peer(self, conversation_id: UUID, user_id: UUID) -> User | None:
        result = await self.session.execute(
            select(User)
            .join(ConversationMember, ConversationMember.user_id == User.id)
            .where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> list[Conversation]:
        member_conv_ids = select(ConversationMember.conversation_id).where(
            ConversationMember.user_id == user_id
        )
        result = await self.session.execute(
            select(Conversation)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
            .where(Conversation.id.in_(member_conv_ids))
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().unique())

    async def create_direct(self, user_id: UUID, peer_id: UUID) -> Conversation:
        existing = await self.get_pair(user_id, peer_id)
        if existing:
            conversation = await self.get(existing.conversation_id)
            assert conversation is not None
            return conversation

        conversation = Conversation()
        self.session.add(conversation)
        await self.session.flush()

        self.session.add(ConversationMember(conversation_id=conversation.id, user_id=user_id))
        self.session.add(ConversationMember(conversation_id=conversation.id, user_id=peer_id))
        low, high = (user_id, peer_id) if user_id < peer_id else (peer_id, user_id)
        self.session.add(
            ConversationPair(conversation_id=conversation.id, user_low_id=low, user_high_id=high)
        )
        await self.session.flush()
        return await self.get(conversation.id)  # type: ignore[return-value]

    async def last_message_preview(self, conversation_id: UUID) -> tuple[str | None, object | None]:
        result = await self.session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        message = result.scalar_one_or_none()
        if message is None:
            return None, None
        if message.deleted_at is not None:
            return "Message deleted", message.created_at
        if message.message_type != "text":
            return f"{message.message_type.capitalize()} attachment", message.created_at
        preview = (message.content or "")[:80]
        return preview, message.created_at

    async def unread_count(self, conversation_id: UUID, user_id: UUID) -> int:
        from app.models import MessageStatus

        result = await self.session.execute(
            select(func.count(Message.id))
            .join(MessageStatus, MessageStatus.message_id == Message.id)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.deleted_at.is_(None),
                MessageStatus.user_id == user_id,
                MessageStatus.status != "read",
            )
        )
        return int(result.scalar_one())
