"""
FastAPI Dependencies

Shared dependencies for database sessions, authentication, and authorization.
"""

from typing import AsyncGenerator, Annotated
from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.core.auth import verify_clerk_jwt, verify_clerk_token_str


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database session dependency.

    Provides an async database session with automatic commit/rollback.

    Usage:
        @app.get("/endpoint")
        async def endpoint(db: AsyncSession = Depends(get_db)):
            # Use db here
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

# Define security scheme for Swagger UI
security = HTTPBearer()

async def get_current_user(
    request: Request,
    token: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Authentication dependency - verify Clerk JWT and return user ID.

    Uses Clerk SDK to verify JWT from Authorization header.
    The Security(security) dependency ensures Swagger UI shows the Authorize button.

    Args:
        request: FastAPI Request object
        token: Bearer token (extracted by FastAPI for Swagger)

    Returns:
        str: Clerk user ID from JWT sub claim

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    # Verify JWT with Clerk using Request object
    # We pass the request to Clerk SDK which handles the verification
    print(f"🕵️ [deps.py] get_current_user received token credentials: {token.credentials[:15]}...")
    payload = await verify_clerk_token_str(token.credentials)
    if not payload:
        print("❌ [deps.py] Payload is None after verification")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    print(f"✅ [deps.py] Verified user: {payload.get('sub')}")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return user_id


async def get_current_admin_user(
    current_user: Annotated[str, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    """
    Admin authorization dependency.

    Verifies that the current user has admin role by checking the database.

    Args:
        current_user: Clerk user ID from get_current_user dependency
        db: Database session

    Returns:
        str: Clerk user ID if user is admin

    Raises:
        HTTPException: 403 if user is not an admin
    """
    from sqlalchemy import select
    from app.models.user import User
    
    # Query user from database
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()
    
    # Check if user exists and has admin role
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


async def require_active_subscription(
    current_user: Annotated[str, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    """
    Subscription enforcement dependency.

    Verifies that the current user's restaurant has an active subscription
    before allowing access to protected features (products, 3D models, assets).

    Returns:
        str: Clerk user ID if subscription is active

    Raises:
        HTTPException: 403 if no active subscription
    """
    from sqlalchemy import select
    from app.models.user import User
    from app.models.restaurant import Restaurant
    from app.models.subscription import Subscription

    # Get user
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get restaurant
    result = await db.execute(
        select(Restaurant).where(Restaurant.owner_id == user.id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get subscription (may be None during trial — that's OK)
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant.id)
    )
    subscription = result.scalar_one_or_none()

    # Check access: trial period OR active subscription
    from app.core.subscriptions import can_access_features
    
    if not can_access_features(restaurant, subscription):
        raise HTTPException(
            status_code=403,
            detail="Active subscription or trial required. Please subscribe to continue."
        )

    return current_user
