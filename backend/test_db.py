import asyncio
from app.db.session import async_session_maker
from app.repositories.message_repo import MessageRepository
from sqlalchemy import text

async def run():
    async with async_session_maker() as session:
        repo = MessageRepository(session)
        res = await session.execute(text("SELECT id, created_at, content FROM messages LIMIT 5;"))
        for r in res:
            print(r)

asyncio.run(run())
