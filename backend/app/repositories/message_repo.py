from datetime import timezone, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Attachment, DeliveryState, Message, MessageStatus


class MessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _base_query(self):
        return select(Message).options(
            selectinload(Message.attachments),
            selectinload(Message.statuses),
            selectinload(Message.sender),
            selectinload(Message.reply_to),
        )

    async def get(self, message_id: UUID) -> Message | None:
        result = await self.session.execute(self._base_query().where(Message.id == message_id))
        return result.scalar_one_or_none()

    async def list_page(
        self,
        conversation_id: UUID,
        limit: int,
        before: datetime | None,
    ) -> list[Message]:
        query = self._base_query().where(Message.conversation_id == conversation_id)
        if before is not None:
            query = query.where(Message.created_at < before)
        query = query.order_by(Message.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        items = list(result.scalars().unique())
        items.reverse()
        return items

    async def create(self, message: Message) -> Message:
        self.session.add(message)
        await self.session.flush()
        return await self.get(message.id)  # type: ignore[return-value]

    async def add_status(self, status: MessageStatus) -> None:
        self.session.add(status)
        await self.session.flush()

    async def add_attachment(self, attachment: Attachment) -> Attachment:
        self.session.add(attachment)
        await self.session.flush()
        await self.session.refresh(attachment)
        return attachment

    async def get_attachment(self, attachment_id: UUID) -> Attachment | None:
        return await self.session.get(Attachment, attachment_id)

    async def mark_delivered(self, conversation_id: UUID, recipient_id: UUID) -> list[UUID]:
        result = await self.session.execute(
            select(MessageStatus)
            .join(Message, Message.id == MessageStatus.message_id)
            .where(
                Message.conversation_id == conversation_id,
                MessageStatus.user_id == recipient_id,
                MessageStatus.status == DeliveryState.SENT.value,
            )
        )
        ids: list[UUID] = []
        now = datetime.now(timezone.utc)
        for row in result.scalars():
            row.status = DeliveryState.DELIVERED.value
            row.delivered_at = now
            ids.append(row.message_id)
        await self.session.flush()
        return ids

    async def mark_read(self, conversation_id: UUID, recipient_id: UUID) -> list[UUID]:
        result = await self.session.execute(
            select(MessageStatus)
            .join(Message, Message.id == MessageStatus.message_id)
            .where(
                Message.conversation_id == conversation_id,
                MessageStatus.user_id == recipient_id,
                MessageStatus.status != DeliveryState.READ.value,
            )
        )
        ids: list[UUID] = []
        now = datetime.now(timezone.utc)
        for row in result.scalars():
            row.status = DeliveryState.READ.value
            if row.delivered_at is None:
                row.delivered_at = now
            row.read_at = now
            ids.append(row.message_id)
        await self.session.flush()
        return ids

    async def mark_message_read(self, message_id: UUID, recipient_id: UUID) -> MessageStatus | None:
        result = await self.session.execute(
            select(MessageStatus).where(
                MessageStatus.message_id == message_id,
                MessageStatus.user_id == recipient_id,
            )
        )
        status = result.scalar_one_or_none()
        if status is None:
            return None
        now = datetime.now(timezone.utc)
        status.status = DeliveryState.READ.value
        if status.delivered_at is None:
            status.delivered_at = now
        status.read_at = now
        await self.session.flush()
        return status

    async def touch_conversation(self, conversation_id: UUID) -> None:
        from app.models import Conversation

        await self.session.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=datetime.now(timezone.utc))
        )
