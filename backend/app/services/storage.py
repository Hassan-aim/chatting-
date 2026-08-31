from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from pathlib import Path
from uuid import uuid4

import aiofiles
import aiofiles.os

from app.core.config import get_settings


class StorageService(ABC):
    """Object-storage abstraction. Local disk now; S3/R2/MinIO later."""

    @abstractmethod
    async def save_stream(self, stream: AsyncIterator[bytes], suffix: str) -> str:
        """Persist bytes and return an opaque storage key."""

    @abstractmethod
    async def open_stream(self, key: str) -> AsyncIterator[bytes]:
        """Yield file bytes for authorized downloads."""

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def exists(self, key: str) -> bool:
        ...


class LocalStorageService(StorageService):
    def __init__(self, root: str | None = None) -> None:
        settings = get_settings()
        self.root = Path(root or settings.storage_path).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    async def save_stream(self, stream: AsyncIterator[bytes], suffix: str) -> str:
        key = f"{uuid4().hex}{suffix}"
        path = self.root / key
        async with aiofiles.open(path, "wb") as handle:
            async for chunk in stream:
                await handle.write(chunk)
        return key

    async def open_stream(self, key: str) -> AsyncIterator[bytes]:
        path = self._safe_path(key)
        async with aiofiles.open(path, "rb") as handle:
            while True:
                chunk = await handle.read(64 * 1024)
                if not chunk:
                    break
                yield chunk

    async def delete(self, key: str) -> None:
        path = self._safe_path(key)
        if path.exists():
            await aiofiles.os.remove(path)

    async def exists(self, key: str) -> bool:
        return self._safe_path(key).exists()

    def _safe_path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if not str(path).startswith(str(self.root)):
            raise ValueError("Invalid storage key")
        return path


class S3StorageService(StorageService):
    """Placeholder for AWS S3 / Cloudflare R2 / MinIO.

    Implement with aioboto3 using settings.s3_* without changing callers.
    """

    async def save_stream(self, stream: AsyncIterator[bytes], suffix: str) -> str:
        raise NotImplementedError("Configure STORAGE_TYPE=s3 and implement S3StorageService")

    async def open_stream(self, key: str) -> AsyncIterator[bytes]:
        raise NotImplementedError
        yield b""  # pragma: no cover — keeps this an async generator

    async def delete(self, key: str) -> None:
        raise NotImplementedError

    async def exists(self, key: str) -> bool:
        raise NotImplementedError


def build_storage() -> StorageService:
    settings = get_settings()
    if settings.storage_type == "s3":
        return S3StorageService()
    return LocalStorageService()
