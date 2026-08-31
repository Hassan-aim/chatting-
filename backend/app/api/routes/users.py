from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exception_handlers import success_body
from app.db.session import get_db
from app.models import User
from app.schemas.auth import UserBrief, UserPublic

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def me(current: User = Depends(get_current_user)) -> dict:
    return success_body(UserPublic.model_validate(current).model_dump(mode="json"))


@router.get("/search")
async def search_users(
    q: str = Query(min_length=1, max_length=32),
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(
        select(User)
        .where(User.id != current.id, User.username.ilike(f"{q}%"))
        .order_by(User.username)
        .limit(20)
    )
    users = [UserBrief.model_validate(u).model_dump(mode="json") for u in result.scalars()]
    return success_body(users)
