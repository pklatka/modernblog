from datetime import UTC, datetime, timedelta
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .config import get_settings
from .database import get_session_local
from .models import RateLimit


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for non-API routes or specific paths if needed
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        if client_ip == "unknown":
            return await call_next(request)

        settings = get_settings()
        limit_count = settings.GLOBAL_RATE_LIMIT_COUNT
        limit_window = settings.GLOBAL_RATE_LIMIT_WINDOW_SECONDS

        SessionLocal = get_session_local()
        db = SessionLocal()

        try:
            current_time = datetime.now(UTC)
            rate_limit = (
                db.query(RateLimit).filter(RateLimit.ip_address == client_ip).first()
            )

            if not rate_limit:
                # First request from this IP
                rate_limit = RateLimit(
                    ip_address=client_ip, request_count=1, window_start=current_time
                )
                db.add(rate_limit)
                db.commit()
            else:
                # Check if window has expired
                window_end = rate_limit.window_start.replace(tzinfo=UTC) + timedelta(
                    seconds=limit_window
                )

                if current_time > window_end:
                    # Reset window
                    rate_limit.window_start = current_time
                    rate_limit.request_count = 1
                    db.commit()
                else:
                    # Increment count
                    if rate_limit.request_count >= limit_count:
                        return Response(content="Too Many Requests", status_code=429)

                    rate_limit.request_count += 1
                    db.commit()

        except Exception:
            # Fallback: log error and allow request to proceed so we don't break the app
            pass
        finally:
            db.close()

        response = await call_next(request)
        return response
