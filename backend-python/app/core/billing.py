"""
Billing Business Logic

Functions for calculating billing amounts and product counts.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.subscription import Subscription


async def calculate_active_products_count(
    db: AsyncSession, restaurant_id: str
) -> int:
    """
    Count active products for billing purposes.

    Products counted if active=True (regardless of show_in_menu).

    Args:
        db: Database session
        restaurant_id: Restaurant UUID

    Returns:
        int: Number of active products
    """
    result = await db.execute(
        select(func.count(Product.id))
        .where(Product.restaurant_id == restaurant_id)
        .where(Product.active == True)
    )
    count = result.scalar()
    return count or 0


async def calculate_next_bill_amount(
    db: AsyncSession, restaurant_id: str, per_product_price: int = 300
) -> int:
    """
    Calculate next billing amount based on active products.

    Formula: active_products_count * 300 PKR

    Args:
        db: Database session
        restaurant_id: Restaurant UUID
        per_product_price: Price per product in PKR (default: 300)

    Returns:
        int: Next bill amount in PKR
    """
    count = await calculate_active_products_count(db, restaurant_id)
    return count * per_product_price


async def update_subscription_product_count(
    db: AsyncSession, subscription: Subscription
) -> None:
    """
    Update subscription's active_products_count and sync usage to Lemon Squeezy.
    
    Note: next_bill_amount is calculated by webhook handler (includes setup fee logic).
    
    Args:
        db: Database session
        subscription: Subscription instance
    """
    count = await calculate_active_products_count(
        db, str(subscription.restaurant_id)
    )
    subscription.active_products_count = count
    
    # Note: We do NOT update next_bill_amount here anymore.
    # The webhook handler calculates it with proper setup fee logic (4999 first time).
    
    await db.commit()

    # Report usage to Lemon Squeezy if active subscription item exists
    if subscription.lemon_subscription_item_id:
        from app.services.lemon_squeezy import report_usage
        print(f"🔄 Syncing usage to Lemon Squeezy: {count} active products")
        await report_usage(subscription.lemon_subscription_item_id, count)
