from collections import defaultdict, deque
from time import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.core.exception_handlers import error_body


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Fixed-window limiter. Swap for Redis-backed counters when scaling out."""

    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        settings = get_settings()
        if request.url.path.startswith("/api/"):
            key = request.client.host if request.client else "unknown"
            now = time()
            window = 60.0
            bucket = self._hits[key]
            while bucket and now - bucket[0] > window:
                bucket.popleft()
            if len(bucket) >= settings.api_rate_limit_per_minute:
                return JSONResponse(
                    status_code=429,
                    content=error_body("RATE_LIMITED", "Too many requests"),
                )
            bucket.append(now)
        return await call_next(request)


class LoginLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, ip: str, limit: int = 20, window: float = 60.0) -> bool:
        now = time()
        bucket = self._hits[ip]
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


login_limiter = LoginLimiter()
