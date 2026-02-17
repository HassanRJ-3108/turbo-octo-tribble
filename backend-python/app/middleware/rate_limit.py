"""
Rate Limiting Middleware

Implements simple in-memory rate limiting for API endpoints.
Protected endpoints: 100 requests/minute per IP
Public endpoints: 1000 requests/minute per IP

For production, consider using Redis-backed rate limiting.
"""

import time
from collections import defaultdict
from typing import Dict, List

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.

    Tracks requests per IP address and enforces different limits
    for protected vs public endpoints.
    """

    def __init__(self, app):
        super().__init__(app)
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.protected_limit = settings.RATE_LIMIT_PER_MINUTE_PROTECTED
        self.public_limit = settings.RATE_LIMIT_PER_MINUTE_PUBLIC

    def is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (higher rate limit)"""
        public_paths = [
            "/health",
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/menu/",  # Public menu endpoint
        ]
        return any(path.startswith(p) for p in public_paths)

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Determine rate limit based on endpoint
        limit = (
            self.public_limit
            if self.is_public_endpoint(request.url.path)
            else self.protected_limit
        )

        # Clean old requests (older than 1 minute)
        current_time = time.time()
        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if current_time - req_time < 60
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "detail": f"Rate limit exceeded: {limit} requests per minute",
                    "retry_after": 60,
                },
            )

        # Record request
        self.requests[client_ip].append(current_time)

        # Process request
        response = await call_next(request)
        return response
