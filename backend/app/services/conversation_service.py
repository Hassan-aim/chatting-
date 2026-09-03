from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.models import Conversation, ConversationMember, User
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import UserBrief
from app.schemas.conversation import ConversationOut


class ConversationService:
    def __init__(self, session: AsyncSession) -> None:
        self.conversations = ConversationRepository(session)
        self.users = UserRepository(session)

    async def create_direct(self, current_user: User, peer_username: str) -> ConversationOut:
        if peer_username == current_user.username:
            raise ForbiddenError("Cannot start a conversation with yourself")
        peer = await self.users.get_by_username(peer_username)
        if peer is None:
            raise NotFoundError("USER_NOT_FOUND", "User not found")
        conversation = await self.conversations.create_direct(current_user.id, peer.id)
        return await self._to_out(conversation, current_user.id)

    async def list_mine(self, current_user: User) -> list[ConversationOut]:
        items = await self.conversations.list_for_user(current_user.id)
        return [await self._to_out(c, current_user.id) for c in items]

    async def get_for_member(self, conversation_id: UUID, user_id: UUID) -> Conversation:
        conversation = await self.conversations.get(conversation_id)
        if conversation is None:
            raise NotFoundError("CONVERSATION_NOT_FOUND", "Conversation not found")
        if not await self.conversations.is_member(conversation_id, user_id):
            raise ForbiddenError("You are not a member of this conversation")
        return conversation

    async def get_out(self, conversation_id: UUID, user_id: UUID) -> ConversationOut:
        conversation = await self.get_for_member(conversation_id, user_id)
        return await self._to_out(conversation, user_id)

    async def toggle_pin(self, conversation_id: UUID, user_id: UUID) -> bool:
        member = await self.conversations.get_member(conversation_id, user_id)
        if member is None:
            raise ForbiddenError("You are not a member of this conversation")
        member.is_pinned = not member.is_pinned
        await self.conversations.session.flush()
        return member.is_pinned

    async def toggle_mute(self, conversation_id: UUID, user_id: UUID) -> bool:
        member = await self.conversations.get_member(conversation_id, user_id)
        if member is None:
            raise ForbiddenError("You are not a member of this conversation")
        member.is_muted = not member.is_muted
        await self.conversations.session.flush()
        return member.is_muted

    async def _to_out(self, conversation: Conversation, user_id: UUID) -> ConversationOut:
        peer = next(m.user for m in conversation.members if m.user_id != user_id)
        preview, last_at = await self.conversations.last_message_preview(conversation.id)
        unread = await self.conversations.unread_count(conversation.id, user_id)
        member = next((m for m in conversation.members if m.user_id == user_id), None)
        return ConversationOut(
            id=conversation.id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            peer=UserBrief.model_validate(peer),
            last_message_preview=preview,
            last_message_at=last_at,  # type: ignore[arg-type]
            unread_count=unread,
            is_pinned=member.is_pinned if member else False,
            is_muted=member.is_muted if member else False,
        )
