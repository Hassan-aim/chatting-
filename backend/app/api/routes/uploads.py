from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_storage, get_upload_service
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.exception_handlers import success_body
from app.db.session import get_db
from app.models import User
from app.schemas.message import AttachmentOut
from app.services.storage import StorageService
from app.services.upload_service import UploadService

router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/uploads")
async def upload_file(
    conversation_id: UUID = Form(...),
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> dict:
    settings = get_settings()
    size = 0

    async def stream() -> AsyncIterator[bytes]:
        nonlocal size
        while True:
            chunk = await file.read(64 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > settings.max_upload_size:
                raise AppError("FILE_TOO_LARGE", "File exceeds maximum size", 413)
            yield chunk

    attachment = await service.store_pending(
        current.id,
        conversation_id,
        file.filename or "file",
        file.content_type,
        1,
        stream(),
    )
    attachment.file_size = size
    return success_body(AttachmentOut.model_validate(attachment).model_dump(mode="json"))


@router.get("/attachments/{attachment_id}")
async def download_attachment(
    attachment_id: UUID,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
    service: UploadService = Depends(get_upload_service),
) -> StreamingResponse:
    attachment = await service.get_authorized(attachment_id, current.id)
    stream = storage.open_stream(attachment.storage_key)
    return StreamingResponse(
        stream,
        media_type=attachment.mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{attachment.file_name}"',
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )
