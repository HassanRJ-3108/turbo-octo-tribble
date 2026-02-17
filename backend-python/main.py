"""
Foodar Backend API - Main Application Entry Point

FastAPI backend for restaurant AR menu platform with Clerk auth,
Supabase DB, Lemon Squeezy payments, Cloudinary storage, and 3D model management.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.api.v1 import router as v1_router
from app.api.deps import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

# Create FastAPI application
app = FastAPI(
    title="Foodar Backend API",
    description="Backend API for Foodar restaurant AR menu platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include API v1 router
app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "service": "foodar-backend-api",
        "version": "1.0.0",
    }


@app.get("/")
async def root() -> dict:
    """Root endpoint"""
    return {
        "message": "Foodar Backend API",
        "docs": "/docs",
        "health": "/health",
    }


# Temporary Debug Endpoint
from fastapi import Body, Request
from app.core.auth import verify_clerk_jwt
from starlette.requests import Request as StarletteRequest

@app.post("/api/v1/debug-token")
async def debug_token(request: Request, token: str = Body(..., embed=True)):
    """Debug endpoint to check token validity and return reason"""
    # Create a mock request with the token in header
    scope = request.scope.copy()
    headers = dict(request.headers)
    # Ensure headers are lowercase bytes
    headers[b"authorization"] = f"Bearer {token}".encode()
    scope["headers"] = [(k, v) for k, v in headers.items() if isinstance(k, bytes)]
    
    # Mock request object
    mock_request = StarletteRequest(scope)
    
    # Try verification
    try:
        # Re-import to ensure fresh module state if needed
        from app.core.auth import debug_clerk_jwt
        is_valid, payload, error = debug_clerk_jwt(mock_request)
        
        if is_valid:
            return {"status": "valid", "payload": payload}
        else:
            return {
                "status": "invalid", 
                "message": f"Verification failed: {error}",
                "tip": "Check if token is expired or issued by a different instance"
            }
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/v1/debug-header")
async def debug_header(request: Request):
    """Debug endpoint to see raw authorization header"""
    return {
        "authorization_header": request.headers.get("authorization"),
        "headers": dict(request.headers)
    }

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security, Depends
security = HTTPBearer()

@app.get("/api/v1/debug-dependency")
async def debug_dependency(token: HTTPAuthorizationCredentials = Security(security)):
    """Debug endpoint to see what HTTPBearer extracts"""
    return {
        "token_credentials": token.credentials,
        "scheme": token.scheme
    }

@app.get("/api/v1/debug-me")
async def debug_me(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to see current user's database record"""
    from sqlalchemy import select
    from app.models.user import User
    
    result = await db.execute(
        select(User).where(User.clerk_user_id == current_user)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return {"error": "User not found in database", "clerk_user_id": current_user}
    
    return {
        "clerk_user_id": user.clerk_user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": str(user.created_at)
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
