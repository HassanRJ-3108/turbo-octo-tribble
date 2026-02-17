"""
Public Menu API Endpoints

Public endpoints for accessing restaurant menus (no authentication required).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.public_menu import PublicMenuResponse, ProductPublic
from app.models.restaurant import Restaurant
from app.models.product import Product
from app.models.subscription import Subscription

router = APIRouter()


@router.get("/menu/{slug}", response_model=PublicMenuResponse)
async def get_public_menu(
    slug: str, db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get public menu by restaurant slug.

    No authentication required. Returns active products for display.
    """
    # Get restaurant by slug
    result = await db.execute(
        select(Restaurant).where(Restaurant.slug == slug)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get subscription (may be None during or before trial)
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant.id)
    )
    subscription = result.scalar_one_or_none()

    # Check if restaurant can display menu (trial OR active subscription)
    from app.core.subscriptions import can_access_features
    
    if not can_access_features(restaurant, subscription):
        return {
            "restaurant_name": restaurant.name,
            "slug": restaurant.slug,
            "status": "unavailable",
            "products": [],
            "total_products": 0,
        }

    # Get products where show_in_menu=true, ordered by order_index
    from sqlalchemy.orm import joinedload
    from app.services.supabase_storage import generate_signed_url
    from app.schemas.public_menu import ARModelPublic

    result = await db.execute(
        select(Product)
        .where(Product.restaurant_id == restaurant.id)
        .where(Product.show_in_menu == True)
        .where(Product.active == True)
        .options(joinedload(Product.ar_model))
        .order_by(Product.order_index)
    )
    products = result.scalars().all()

    # Refresh signed URLs for AR models
    public_products = []
    for p in products:
        product_data = ProductPublic.model_validate(p)
        if p.ar_model:
            # Generate fresh signed URL
            file_url = generate_signed_url(p.ar_model.storage_path)
            
            # Create ARModelPublic manually to override file_url
            ar_model_data = ARModelPublic(
                id=p.ar_model.id,
                name=p.ar_model.name,
                file_url=file_url,
                thumbnail_url=p.ar_model.thumbnail_url,
                height=p.ar_model.height,
                width=p.ar_model.width,
                depth=p.ar_model.depth,
                dimension_unit=p.ar_model.dimension_unit
            )
            product_data.ar_model = ar_model_data
            
        public_products.append(product_data)

    return {
        "restaurant_name": restaurant.name,
        "slug": restaurant.slug,
        "status": "active",
        "products": public_products,
        "total_products": len(products),
    }
