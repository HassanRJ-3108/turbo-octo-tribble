"""
Restaurant API Endpoints

Handles restaurant data retrieval and updates.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.schemas.restaurant import RestaurantRead, RestaurantUpdate
from app.models.user import User
from app.models.restaurant import Restaurant

router = APIRouter()


@router.get("/restaurants", response_model=list[RestaurantRead])
async def get_restaurants(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Restaurant]:
    """
    Get all restaurants owned by current user.

    Admins can see all restaurants.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Query restaurants
    if user.role == "admin":
        # Admin sees all
        result = await db.execute(select(Restaurant))
    else:
        # Owner sees only their restaurants
        result = await db.execute(
            select(Restaurant).where(Restaurant.owner_id == user.id)
        )

    restaurants = result.scalars().all()
    return list(restaurants)


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantRead)
async def get_restaurant(
    restaurant_id: UUID,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Restaurant:
    """Get restaurant by ID"""
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get restaurant
    result = await db.execute(
        select(Restaurant)
        .options(
            selectinload(Restaurant.onboarding),
            selectinload(Restaurant.subscription),
            selectinload(Restaurant.models_3d),
            selectinload(Restaurant.products),
            selectinload(Restaurant.assets),
        )
        .where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Check authorization
    if restaurant.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return restaurant


@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantRead)
async def update_restaurant(
    restaurant_id: UUID,
    data: RestaurantUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Restaurant:
    """Update restaurant details"""
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Check authorization
    if restaurant.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Update fields
    if data.name is not None:
        restaurant.name = data.name
    if data.custom_domain is not None:
        restaurant.custom_domain = data.custom_domain
    if data.status is not None and user.role == "admin":
        # Only admins can change status
        restaurant.status = data.status

    await db.commit()
    await db.refresh(restaurant)
    return restaurant
