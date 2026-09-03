from fastapi import APIRouter

from app.api.routes import auth, conversations, messages, profile, uploads, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(conversations.router)
api_router.include_router(messages.router)
api_router.include_router(uploads.router)
api_router.include_router(profile.router)
