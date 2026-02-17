"""
API v1 Main Router

Aggregates all v1 endpoints and provides a health check endpoint.
Individual domain routers will be added here as they are created.
"""

from fastapi import APIRouter

# Create v1 router
router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """
    API v1 health check endpoint.

    Returns:
        dict: Health status information
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "api": "v1",
    }


# Include domain routers
from app.api.v1 import (
    onboarding,
    restaurants,
    subscriptions,
    models_3d,
    products,
    assets,
    public_menu,
    admin,
    webhooks,
)

router.include_router(onboarding.router, tags=["onboarding"])
router.include_router(restaurants.router, tags=["restaurants"])
router.include_router(subscriptions.router, tags=["subscriptions"])
router.include_router(models_3d.router, tags=["3d-models"])
router.include_router(products.router, tags=["products"])
router.include_router(assets.router, tags=["assets"])
router.include_router(public_menu.router, tags=["public-menu"])
router.include_router(admin.router, tags=["admin"])
router.include_router(webhooks.router, tags=["webhooks"])
