"""
Onboarding API Endpoints

Handles restaurant onboarding application submission and viewing.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.schemas.onboarding import OnboardingSubmit, OnboardingRead
from app.schemas.restaurant import RestaurantRead
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.onboarding import RestaurantOnboarding
from app.utils.slug import generate_slug, generate_unique_slug
from app.services.cloudinary_service import upload_image
from app.utils.validators import validate_image

router = APIRouter()


@router.post("/onboarding/upload")
async def upload_onboarding_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
) -> dict:
    """
    Upload a file during onboarding (CNIC, food license, restaurant photos).
    
    Only requires authentication (no subscription needed).
    Returns the Cloudinary URL to be included in the onboarding submission.
    """
    # Validate image
    validate_image(file)
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Upload to Cloudinary under onboarding folder
    result = upload_image(file_bytes, f"onboarding/{current_user}", file.filename)
    
    return {"url": result["url"], "public_id": result["public_id"]}


@router.post("/onboarding", response_model=RestaurantRead, status_code=201)
async def submit_onboarding(
    data: OnboardingSubmit,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Restaurant:
    """
    Submit restaurant onboarding application.

    Creates restaurant and onboarding records with status 'pending'.
    """
    # Get user from database
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has a restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    existing_restaurant = result.scalar_one_or_none()

    if existing_restaurant:
        if existing_restaurant.status == "rejected":
            # Allow re-submission: Reset status to pending and continue
            print(f"🔄 Resubmitting rejected restaurant: {existing_restaurant.id}")
            existing_restaurant.status = "pending"
            
            # Update fields if provided (restaurant_name might change)
            if data.restaurant_name != existing_restaurant.name:
                existing_restaurant.name = data.restaurant_name
                # Note: We keep the old slug to avoid breaking links, or we could regenerate it
            
            restaurant = existing_restaurant
            # Skip creation, jump to onboarding creation
        else:
            raise HTTPException(
                status_code=400, detail="User already has a restaurant application"
            )
    else:
        # Generate unique slug
        base_slug = generate_slug(data.restaurant_name)
        unique_slug = await generate_unique_slug(db, base_slug)

        # Create restaurant
        restaurant = Restaurant(
            owner_id=user.id,
            name=data.restaurant_name,
            slug=unique_slug,
            status="pending",
        )
        db.add(restaurant)
        await db.flush()  # Get restaurant.id

    # Create onboarding record (always create new one for history/latest)
    onboarding = RestaurantOnboarding(
        restaurant_id=restaurant.id,
        phone=data.phone,
        address=data.address,
        description=data.description,
        documents=data.documents,
        photos=data.photos,
    )
    db.add(onboarding)
    await db.commit()
    await db.refresh(restaurant)

    return restaurant


@router.get("/onboarding/{restaurant_id}", response_model=OnboardingRead)
async def get_onboarding(
    restaurant_id: UUID,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RestaurantOnboarding:
    """
    Get onboarding application details.

    Only accessible by restaurant owner or admin.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get onboarding with restaurant
    result = await db.execute(
        select(RestaurantOnboarding)
        .options(selectinload(RestaurantOnboarding.restaurant))
        .where(RestaurantOnboarding.restaurant_id == restaurant_id)
    )
    onboarding = result.scalar_one_or_none()

    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")

    # Check authorization (owner or admin)
    if onboarding.restaurant.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return onboarding
