"""
Assets API Endpoints

Handles asset uploads and management.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user, require_active_subscription
from app.schemas.asset import AssetRead
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.asset import Asset
from app.services.cloudinary_service import (
    upload_image,
    upload_video,
    delete_asset,
)
from app.utils.validators import validate_image, validate_video

router = APIRouter()


@router.post("/assets", response_model=AssetRead, status_code=201)
async def create_asset(
    file: UploadFile = File(...),
    asset_type: str = "image",
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
) -> Asset:
    """Upload asset to Cloudinary (requires active subscription)"""
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Validate and upload
    file_bytes = await file.read()
    if asset_type == "image":
        validate_image(file)
        result = upload_image(file_bytes, str(restaurant.id), file.filename)
    elif asset_type == "video":
        validate_video(file)
        result = upload_video(file_bytes, str(restaurant.id), file.filename)
    else:
        raise HTTPException(status_code=400, detail="Invalid asset type")

    # Create asset record
    asset = Asset(
        restaurant_id=restaurant.id,
        url=result["url"],
        public_id=result["public_id"],
        type=asset_type,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.get("/assets", response_model=list[AssetRead])
async def list_assets(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Asset]:
    """List restaurant's assets"""
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    result = await db.execute(
        select(Asset).where(Asset.restaurant_id == restaurant.id)
    )
    assets = result.scalars().all()
    return list(assets)


@router.delete("/assets/{asset_id}", status_code=204)
async def delete_asset_endpoint(
    asset_id: UUID,
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Delete asset (requires active subscription)"""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete from Cloudinary
    delete_asset(asset.public_id, asset.type)

    # Delete from DB
    await db.delete(asset)
    await db.commit()
    return None
