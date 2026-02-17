"""
Admin API Endpoints

Handles admin operations for restaurant management and analytics.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_admin_user
from app.schemas.restaurant import RestaurantRead
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.onboarding import RestaurantOnboarding
from app.models.subscription import Subscription
from app.core.emails import (
    send_restaurant_approval_email,
    send_restaurant_rejection_email,
)

router = APIRouter()


@router.get("/admin/analytics")
async def get_analytics(
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get platform analytics.

    Admin only endpoint.
    """
    # Total restaurants
    result = await db.execute(select(func.count(Restaurant.id)))
    total_restaurants = result.scalar()

    # Restaurants by status
    result = await db.execute(
        select(Restaurant.status, func.count(Restaurant.id))
        .group_by(Restaurant.status)
    )
    by_status = {status: count for status, count in result.all()}

    # Active subscriptions
    result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.status == "active")
    )
    active_subscriptions = result.scalar()

    # MRR calculation
    result = await db.execute(
        select(func.sum(Subscription.next_bill_amount))
        .where(Subscription.status == "active")
    )
    mrr = result.scalar() or 0

    # Payment failure rate
    result = await db.execute(
        select(func.count(Subscription.id))
        .where(Subscription.status == "past_due")
    )
    past_due_count = result.scalar() or 0
    total_subs = await db.execute(select(func.count(Subscription.id)))
    total_subs_count = total_subs.scalar() or 1
    failure_rate = (past_due_count / total_subs_count) * 100

    return {
        "total_restaurants": total_restaurants,
        "restaurants_by_status": by_status,
        "active_subscriptions": active_subscriptions,
        "mrr": mrr,
        "payment_failure_rate": round(failure_rate, 2),
    }


@router.post("/admin/restaurants/{restaurant_id}/suspend")
async def suspend_restaurant(
    restaurant_id: UUID,
    reason: str | None = None,
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Suspend restaurant account.

    Admin only endpoint.
    """
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    restaurant.status = "suspended"
    await db.commit()

    return {
        "status": "suspended",
        "message": f"Restaurant '{restaurant.name}' suspended",
        "reason": reason,
    }


router = APIRouter()


@router.get("/admin/restaurants", response_model=list[RestaurantRead])
async def list_restaurants(
    status: str | None = Query(None, description="Filter by status"),
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> list[Restaurant]:
    """
    List all restaurants with optional status filter.

    Admin only endpoint.
    """
    query = select(Restaurant)

    if status:
        query = query.where(Restaurant.status == status)

    result = await db.execute(query.order_by(Restaurant.created_at.desc()))
    restaurants = result.scalars().all()
    return list(restaurants)


@router.get("/admin/restaurants/{restaurant_id}")
async def get_restaurant_details(
    restaurant_id: UUID,
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get detailed restaurant information including onboarding data.

    Admin only endpoint.
    """
    # Get restaurant with onboarding
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get onboarding
    result = await db.execute(
        select(RestaurantOnboarding).where(
            RestaurantOnboarding.restaurant_id == restaurant_id
        )
    )
    onboarding = result.scalar_one_or_none()

    # Get owner
    result = await db.execute(
        select(User).where(User.id == restaurant.owner_id)
    )
    owner = result.scalar_one_or_none()

    return {
        "restaurant": restaurant,
        "onboarding": onboarding,
        "owner": owner,
    }


@router.post("/admin/restaurants/{restaurant_id}/approve")
async def approve_restaurant(
    restaurant_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Approve restaurant application.

    Admin only endpoint. Restaurant gets dashboard access but must subscribe
    to access features (products, 3D models, etc.). Lemon Squeezy handles 
    the 7-day trial after subscription.
    """
    # Get restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.status != "pending":
        raise HTTPException(
            status_code=400, detail="Restaurant is not pending approval"
        )

    # Approve restaurant and start 7-day trial
    now = datetime.utcnow()
    trial_end = now + timedelta(days=7)

    restaurant.status = "approved"
    restaurant.approved_at = now
    restaurant.trial_starts_at = now
    restaurant.trial_ends_at = trial_end

    # Create subscription record (inactive initially, will be activated by LS webhook)
    subscription = Subscription(
        restaurant_id=restaurant.id, 
        status="inactive",
        active_products_count=0,
        next_bill_amount=0  # Will be calculated when user subscribes
    )
    db.add(subscription)

    await db.commit()

    # Get owner for email
    result = await db.execute(
        select(User).where(User.id == restaurant.owner_id)
    )
    owner = result.scalar_one_or_none()

    if owner:
        # Send approval email in background
        background_tasks.add_task(
            send_restaurant_approval_email, owner.email, restaurant.name
        )

    return {
        "status": "approved",
        "message": f"Restaurant '{restaurant.name}' approved. Owner must subscribe to access features.",
    }


@router.post("/admin/restaurants/{restaurant_id}/reject")
async def reject_restaurant(
    restaurant_id: UUID,
    reason: str | None = None,
    permanent: bool = Query(False, description="Permanently delete user from Clerk?"),
    background_tasks: BackgroundTasks = None,
    current_user: str = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Reject restaurant application.

    Args:
        permanent: If True, deletes user from Clerk and DB to save costs.
                   If False, just sets status to 'rejected'.
    """
    # Get restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get owner
    result = await db.execute(
        select(User).where(User.id == restaurant.owner_id)
    )
    owner = result.scalar_one_or_none()

    # Send rejection email FIRST (before deleting user/data)
    if owner and background_tasks:
        background_tasks.add_task(
            send_restaurant_rejection_email,
            owner.email,
            restaurant.name,
            reason,
        )

    if permanent:
        # PERMANENT DELETION
        if owner:
            # Delete from Clerk (fire and forget in background? No, better await to confirm)
            # Actually, let's do it in background to not block response, but user wants confirmation.
            # Let's await it.
            from app.services.clerk_service import delete_clerk_user
            await delete_clerk_user(owner.clerk_user_id)
            
            # Delete from DB
            await db.delete(owner) # Cascades to restaurant
            await db.commit()
            
            return {
                "status": "deleted",
                "message": f"Restaurant '{restaurant.name}' and user permanently deleted.",
                "reason": reason,
            }
    
    # NORMAL REJECTION
    restaurant.status = "rejected"
    await db.commit()

    return {
        "status": "rejected",
        "message": f"Restaurant '{restaurant.name}' rejected",
        "reason": reason,
    }
