from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.errors import AppError, ConflictError
from app.core.exception_handlers import success_body
from app.core.password import hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import UserPublic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api", tags=["profile"])


class ProfileUpdateRequest:
    pass


from pydantic import BaseModel, Field, EmailStr


class ProfileUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class MessageSearchRequest(BaseModel):
    q: str = Field(min_length=1, max_length=100)


@router.patch("/users/me")
async def update_profile(
    payload: ProfileUpdateRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    users = UserRepository(db)
    changed = False

    if payload.username is not None and payload.username != current.username:
        existing = await users.get_by_username(payload.username)
        if existing:
            raise ConflictError("USERNAME_TAKEN", "Username is already taken")
        current.username = payload.username
        changed = True

    if payload.email is not None and payload.email.lower() != current.email:
        existing = await users.get_by_email(payload.email.lower())
        if existing:
            raise ConflictError("EMAIL_TAKEN", "Email is already registered")
        current.email = payload.email.lower()
        changed = True

    if not changed:
        return success_body(UserPublic.model_validate(current).model_dump(mode="json"))

    await db.flush()
    await db.refresh(current)
    return success_body(UserPublic.model_validate(current).model_dump(mode="json"))


@router.post("/users/me/change-password")
async def change_password(
    payload: PasswordChangeRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not verify_password(payload.current_password, current.password_hash):
        raise AppError("INVALID_PASSWORD", "Current password is incorrect", 400)
    current.password_hash = hash_password(payload.new_password)
    await db.flush()
    return success_body({"ok": True})


@router.get("/messages/search")
async def search_messages(
    q: str = "",
    conversation_id: str | None = None,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.models import Conversation, ConversationMember, Message

    # Get all conversations the user is a member of
    member_conv_ids = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == current.id
    )

    query = (
        select(Message)
        .where(
            Message.conversation_id.in_(member_conv_ids),
            Message.content.ilike(f"%{q}%"),
            Message.deleted_at.is_(None),
            Message.message_type == "text",
        )
        .order_by(Message.created_at.desc())
        .limit(50)
    )

    if conversation_id:
        query = query.where(Message.conversation_id == conversation_id)

    result = await db.execute(query)
    messages = result.scalars().all()

    # Load senders
    from sqlalchemy.orm import selectinload

    query_with_sender = (
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.id.in_([m.id for m in messages]))
    )
    result_with_sender = await db.execute(query_with_sender)
    messages_with_sender = result_with_sender.scalars().unique().all()

    items = []
    for msg in messages_with_sender:
        items.append({
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "sender_id": str(msg.sender_id),
            "sender_username": msg.sender.username if msg.sender else None,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        })

    return success_body(items)
