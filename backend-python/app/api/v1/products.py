"""
Products API Endpoints

Handles product CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_db, get_current_user, require_active_subscription
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.product import Product
from app.models.subscription import Subscription
from app.core.billing import update_subscription_product_count

router = APIRouter()


@router.post("/products", response_model=ProductRead, status_code=201)
async def create_product(
    data: ProductCreate,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
) -> Product:
    """Create new product (requires active subscription)"""
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

    product = Product(restaurant_id=restaurant.id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # Update billing count in background
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant.id)
    )
    subscription = result.scalar_one_or_none()
    if subscription:
        background_tasks.add_task(
            update_subscription_product_count, db, subscription
        )

    return product


@router.get("/products", response_model=list[ProductRead])
async def list_products(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Product]:
    """List restaurant's products"""
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
        select(Product).where(Product.restaurant_id == restaurant.id)
    )
    products = result.scalars().all()
    return list(products)


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: UUID,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Product:
    """Get product details"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
) -> Product:
    """Update product (requires active subscription)"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update fields
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)

    # Update billing if active status changed
    if data.active is not None:
        result = await db.execute(
            select(Subscription).where(
                Subscription.restaurant_id == product.restaurant_id
            )
        )
        subscription = result.scalar_one_or_none()
        if subscription:
            background_tasks.add_task(
                update_subscription_product_count, db, subscription
            )

    return product


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Delete product (requires active subscription)"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.active = False
    await db.commit()

    # Update billing count
    result = await db.execute(
        select(Subscription).where(
            Subscription.restaurant_id == product.restaurant_id
        )
    )
    subscription = result.scalar_one_or_none()
    if subscription:
        background_tasks.add_task(
            update_subscription_product_count, db, subscription
        )

    return None
