"""
Subscription Middleware

Checks subscription status for protected routes.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.subscription import Subscription
from app.core.subscriptions import can_access_features


class SubscriptionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check subscription status for protected routes.

    Blocks access if subscription is not active or trial expired.
    """

    def __init__(self, app):
        super().__init__(app)
        # Routes that require active subscription
        self.protected_paths = [
            "/api/v1/products",
            "/api/v1/models",
            "/api/v1/assets",
        ]

    def is_protected(self, path: str) -> bool:
        """Check if path requires subscription check"""
        return any(path.startswith(p) for p in self.protected_paths)

    async def dispatch(self, request: Request, call_next):
        """Check subscription for protected routes"""
        # Skip if not protected route
        if not self.is_protected(request.url.path):
            response = await call_next(request)
            return response

        # Get authorization header
        auth_header = request.headers.get("authorization")
        if not auth_header:
            response = await call_next(request)
            return response

        # TODO: Extract and verify user from JWT
        # For now, this is a placeholder

        response = await call_next(request)
        return response
