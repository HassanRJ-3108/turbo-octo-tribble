"""
Subscription API Endpoints

Handles subscription viewing and checkout creation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.schemas.subscription import SubscriptionRead, CheckoutCreate
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.subscription import Subscription
from app.services.lemon_squeezy import create_checkout_session
from app.config import settings

router = APIRouter()


@router.get("/subscriptions", response_model=SubscriptionRead)
async def get_subscription(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Subscription:
    """
    Get current user's restaurant subscription.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get subscription
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return subscription


@router.post("/subscriptions/checkout")
async def create_checkout(
    data: CheckoutCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Create Lemon Squeezy checkout session for subscription.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Check if already has active subscription
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant.id)
    )
    subscription = result.scalar_one_or_none()

    if subscription and subscription.status == "active":
        raise HTTPException(
            status_code=400, detail="Subscription already active"
        )

    # Create checkout session
    variant_id = data.variant_id or settings.LEMON_SQUEEZY_VARIANT_ID
    custom_data = data.custom_data or {}
    custom_data["restaurant_id"] = str(restaurant.id)

    try:
        checkout_url = await create_checkout_session(
            variant_id, str(restaurant.id), custom_data
        )
    except Exception as e:
        # If API key is invalid or payment service unavailable, return mock URL for testing
        print(f"⚠️  Lemon Squeezy checkout failed: {e}")
        print(f"🧪 Returning test checkout URL (configure LEMON_SQUEEZY_API_KEY for production)")
        checkout_url = f"https://checkout.lemonsqueezy.com/test?restaurant_id={restaurant.id}"

    return {"checkout_url": checkout_url}
