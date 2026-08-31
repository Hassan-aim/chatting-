from __future__ import annotations

import mimetypes
from pathlib import PurePosixPath

from app.core.config import get_settings
from app.core.errors import AppError

ALLOWED_IMAGE = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}
ALLOWED_VIDEO = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
}
ALLOWED_FILE = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".zip": "application/zip",
}

ALLOWED_ALL = {**ALLOWED_IMAGE, **ALLOWED_VIDEO, **ALLOWED_FILE}

IMAGE_MIMES = set(ALLOWED_IMAGE.values())
VIDEO_MIMES = set(ALLOWED_VIDEO.values())


def sniff_mime(filename: str, declared: str | None) -> tuple[str, str]:
    ext = PurePosixPath(filename).suffix.lower()
    if ext not in ALLOWED_ALL:
        raise AppError("UNSUPPORTED_FILE", "File type is not allowed", 400)

    expected = ALLOWED_ALL[ext]
    declared_norm = (declared or "").split(";")[0].strip().lower()
    guessed, _ = mimetypes.guess_type(filename)
    guessed_norm = (guessed or "").lower()

    # Require extension and declared MIME to agree when the client sent a type.
    if declared_norm and declared_norm not in {expected, guessed_norm, "application/octet-stream"}:
        if declared_norm != expected:
            raise AppError("INVALID_MIME", "File MIME type does not match extension", 400)

    return ext, expected


def message_type_for_mime(mime: str) -> str:
    if mime in IMAGE_MIMES:
        return "image"
    if mime in VIDEO_MIMES:
        return "video"
    return "file"


def assert_size(size: int) -> None:
    max_size = get_settings().max_upload_size
    if size > max_size:
        raise AppError("FILE_TOO_LARGE", f"File exceeds maximum size of {max_size} bytes", 413)
    if size <= 0:
        raise AppError("EMPTY_FILE", "File is empty", 400)
