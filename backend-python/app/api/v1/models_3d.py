"""
3D Models API Endpoints

Handles 3D model uploads, listing, and deletion.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user, require_active_subscription
from app.schemas.model_3d import Model3DRead
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.model_3d import Models3D
from app.services.supabase_storage import (
    upload_3d_model,
    generate_signed_url,
    delete_3d_model,
)
from app.utils.validators import validate_3d_model

router = APIRouter()


@router.post("/models", response_model=Model3DRead, status_code=201)
async def create_3d_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str | None = Form(None),
    height: float | None = Form(None),
    width: float | None = Form(None),
    depth: float | None = Form(None),
    dimension_unit: str = Form("cm"),
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
) -> Models3D:
    """Upload 3D model to Supabase Storage (requires active subscription)"""
    # Get user and restaurant
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

    # Validate file
    validate_3d_model(file)

    # Read file
    file_bytes = await file.read()

    # Generate a model ID for storage path
    import uuid
    model_id = uuid.uuid4()

    # Upload to Supabase Storage FIRST
    storage_path = upload_3d_model(
        file_bytes, str(restaurant.id), str(model_id), file.filename
    )
    file_url = generate_signed_url(storage_path)

    # Now create model record with all required fields
    model = Models3D(
        id=model_id,
        restaurant_id=restaurant.id,
        name=name,
        description=description,
        storage_path=storage_path,
        file_url=file_url,
        height=height,
        width=width,
        depth=depth,
        dimension_unit=dimension_unit,
    )
    db.add(model)

    await db.commit()
    await db.refresh(model)
    return model


@router.get("/models", response_model=list[Model3DRead])
async def list_3d_models(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Models3D]:
    """List restaurant's 3D models"""
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
        select(Models3D).where(Models3D.restaurant_id == restaurant.id)
    )
    models = result.scalars().all()
    return list(models)


@router.get("/models/{model_id}", response_model=Model3DRead)
async def get_3d_model(
    model_id: UUID,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Models3D:
    """Get 3D model details with signed URL"""
    result = await db.execute(
        select(Models3D).where(Models3D.id == model_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Refresh signed URL
    model.file_url = generate_signed_url(model.storage_path)
    return model


@router.delete("/models/{model_id}", status_code=204)
async def delete_3d_model_endpoint(
    model_id: UUID,
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Delete 3D model (requires active subscription)"""
    result = await db.execute(
        select(Models3D).where(Models3D.id == model_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Delete from Storage
    delete_3d_model(model.storage_path)

    # Delete from DB
    await db.delete(model)
    await db.commit()
    return None
