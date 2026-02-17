# Research: Foodar Backend API Integration Patterns

**Date**: 2026-02-10
**Feature**: 001-foodar-backend-api
**Status**: Complete

## Overview

This document consolidates research findings for all external integrations required by the Foodar Backend API. Each integration includes working code examples, best practices, and potential pitfalls based on latest documentation (2026).

---

## 1. Clerk JWT Verification in FastAPI

### Decision

Use Clerk Python SDK's `authenticate_request` function with FastAPI dependency injection for JWT verification. Store validated user ID in request state for RLS policy enforcement.

### Implementation Pattern

```python
import os
from clerk_backend_api import Clerk
from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions, AuthStatus
from fastapi import Depends, HTTPException, Request
from typing import Annotated

# Initialize Clerk SDK
clerk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))

async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency that verifies Clerk JWT and returns user ID.
    Raises HTTPException for invalid/expired tokens.
    """
    request_state = clerk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=['https://yourdomain.com']  # Your frontend domain
        )
    )

    if request_state.is_signed_in:
        user_id = request_state.payload.get('sub')  # Clerk user ID
        return user_id
    else:
        # Log reason for debugging
        print(f"Auth failed: {request_state.reason}")
        raise HTTPException(
            status_code=401,
            detail=f"Unauthorized: {request_state.reason}"
        )

# Usage in route
@app.get("/api/v1/restaurants")
async def get_restaurants(user_id: Annotated[str, Depends(get_current_user)]):
    # user_id is the authenticated Clerk user ID
    return {"user_id": user_id}
```

### Key Points

1. **JWKS Endpoint**: Clerk SDK automatically handles JWT verification using Clerk's public JWKS endpoint
2. **Token Claims**: Access user ID via `payload.get('sub')`, session ID via `payload.get('sid')`
3. **Error Handling**: `request_state.reason` provides detailed failure info (expired, invalid signature, etc.)
4. **Authorized Parties**: Validate JWT was issued for your domain to prevent token reuse attacks
5. **Token Refresh**: Frontend Clerk SDK handles automatic token refresh; backend just validates current token

### Alternatives Considered

- Manual JWT verification with PyJWT: More complex, requires manual JWKS fetching and key rotation handling
- Clerk middleware: Less flexible than dependency injection for per-route auth

### Sources

- [Clerk Python SDK Authentication](https://github.com/clerk/clerk-sdk-python)
- [Context7 Clerk Documentation](https://context7.com/clerk/clerk-sdk-python/llms.txt)

---

## 2. Supabase with SQLAlchemy and RLS

### Decision

Use SQLAlchemy async engine with Supabase PostgreSQL connection string. Implement RLS policies for multi-tenant isolation. Use Supabase Python client for Storage operations only.

### SQLAlchemy Async Engine Configuration

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# Supabase connection string (async driver)
DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")
# Format: postgresql+asyncpg://postgres:password@db.project.supabase.co:5432/postgres

engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # SQL logging for development
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,  # Connection pool size
    max_overflow=10  # Additional connections allowed
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# FastAPI dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### RLS Policy Examples

```sql
-- Enable RLS on restaurants table
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own restaurants
CREATE POLICY "Users can view own restaurants"
ON restaurants FOR SELECT
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM users WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
  )
);

-- Policy: Users can only update their own restaurants
CREATE POLICY "Users can update own restaurants"
ON restaurants FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM users WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  owner_id IN (
    SELECT id FROM users WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
  )
);

-- Admin policy: Admins can view all restaurants
CREATE POLICY "Admins can view all restaurants"
ON restaurants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
    AND role = 'admin'
  )
);
```

### RLS with Clerk JWT

To make RLS work with Clerk JWTs, configure Supabase JWT settings:

1. In Supabase dashboard, go to Project Settings → API
2. Set JWT Secret to match Clerk's JWT signing secret (or configure Supabase to accept Clerk's public keys)
3. Alternative: Use custom `SET LOCAL` commands in SQLAlchemy to set session variables

```python
# Alternative: Set custom session variable for RLS
async def get_db_with_user_context(user_id: str):
    async with AsyncSessionLocal() as session:
        try:
            # Set current user for RLS policies
            await session.execute(text(f"SET LOCAL app.current_user_id = '{user_id}'"))
            yield session
        finally:
            await session.close()
```

### Supabase Storage Integration

```python
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # Service key for backend operations
)

# Upload 3D model
async def upload_3d_model(file_bytes: bytes, restaurant_id: str, filename: str) -> str:
    """Upload 3D model to Supabase Storage and return public URL"""
    storage_path = f"{restaurant_id}/models/{filename}"

    # Upload to bucket
    supabase.storage.from_("3d-models").upload(
        storage_path,
        file_bytes,
        file_options={"content-type": "model/gltf-binary"}  # For .glb files
    )

    # Generate signed URL (7 days expiry)
    signed_url = supabase.storage.from_("3d-models").create_signed_url(
        storage_path,
        expires_in=604800  # 7 days in seconds
    )

    return signed_url['signedURL']

# Delete 3D model
async def delete_3d_model(storage_path: str):
    """Delete 3D model from Supabase Storage"""
    supabase.storage.from_("3d-models").remove([storage_path])
```

### Storage Configuration

- **Max file size**: Supabase Storage supports up to 50MB per file by default (configurable in project settings)
- **Bucket policies**: Create RLS policies on `storage.objects` table to control upload/download permissions
- **Signed URLs**: Use for private buckets; expire after specified time

### Key Points

1. **Connection String**: Use `postgresql+asyncpg://` for async SQLAlchemy support
2. **RLS Policies**: Write policies that check `auth.jwt()->>'sub'` matches `clerk_user_id`
3. **Session Variables**: Alternative to JWT for RLS - set `app.current_user_id` per request
4. **Storage SDK**: Use Supabase Python client for Storage operations (not SQLAlchemy)
5. **Service Key**: Backend uses service key for Storage to bypass RLS; frontend uses anon key

### Alternatives Considered

- Direct Supabase client for all operations: Less flexible than SQLAlchemy ORM
- Supabase Auth instead of Clerk: Rejected per project requirements

### Sources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions)
- [Supabase Python Client](https://supabase.com/docs/guides/getting-started/quickstarts/flask)

---

## 3. Lemon Squeezy Webhook Verification

### Decision

Use HMAC-SHA256 signature verification for Lemon Squeezy webhooks. Create Pydantic models for webhook payloads based on official schema. Store events in `webhook_events` table for idempotency.

### Webhook Signature Verification

```python
import hmac
import hashlib
from fastapi import Request, HTTPException

async def verify_lemon_squeezy_webhook(request: Request) -> dict:
    """
    Verify Lemon Squeezy webhook signature and return parsed payload.
    Raises HTTPException if signature is invalid.
    """
    signature = request.headers.get("X-Signature")
    if not signature:
        raise HTTPException(status_code=401, detail="Missing X-Signature header")

    raw_body = await request.body()
    secret = os.getenv("LEMON_SQUEEZY_WEBHOOK_SECRET")

    # Compute HMAC-SHA256 signature
    computed_signature = hmac.new(
        secret.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    # Compare signatures (constant-time comparison)
    if not hmac.compare_digest(signature, computed_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Parse JSON payload
    payload = await request.json()
    return payload
```

### Webhook Payload Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class LemonSqueezyWebhookMeta(BaseModel):
    event_name: str
    custom_data: Optional[Dict[str, Any]] = None

class SubscriptionAttributes(BaseModel):
    store_id: int
    customer_id: int
    order_id: int
    product_id: int
    variant_id: int
    status: str
    renews_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class SubscriptionData(BaseModel):
    type: str
    id: str
    attributes: SubscriptionAttributes

class LemonSqueezyWebhookPayload(BaseModel):
    meta: LemonSqueezyWebhookMeta
    data: SubscriptionData
```

### Webhook Endpoint Implementation

```python
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/api/webhooks/lemon")
async def lemon_squeezy_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Verify signature
    payload = await verify_lemon_squeezy_webhook(request)

    # Parse with Pydantic
    webhook = LemonSqueezyWebhookPayload(**payload)

    # Check idempotency
    event_id = webhook.meta.event_name + "_" + webhook.data.id
    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.lemon_event_id == event_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "duplicate", "message": "Event already processed"}

    # Store webhook event
    webhook_event = WebhookEvent(
        provider="lemon_squeezy",
        event_name=webhook.meta.event_name,
        lemon_event_id=event_id,
        raw_payload=payload,
        processed=False
    )
    db.add(webhook_event)
    await db.commit()

    # Process webhook in background
    background_tasks.add_task(process_lemon_webhook, webhook, db)

    return {"status": "received"}

async def process_lemon_webhook(webhook: LemonSqueezyWebhookPayload, db: AsyncSession):
    """Background task to process webhook"""
    if webhook.meta.event_name == "subscription_payment_success":
        # Extract restaurant_id from custom_data
        restaurant_id = webhook.meta.custom_data.get("restaurant_id")

        # Update subscription in database
        subscription = await db.execute(
            select(Subscription).where(Subscription.restaurant_id == restaurant_id)
        )
        subscription = subscription.scalar_one()
        subscription.status = "active"
        subscription.lemon_subscription_id = webhook.data.id
        subscription.last_billed_at = datetime.utcnow()

        await db.commit()
```

### Checkout Session Creation

```python
import httpx

async def create_lemon_checkout_session(variant_id: int, restaurant_id: str) -> str:
    """
    Create Lemon Squeezy checkout session.
    Returns checkout URL for user to complete payment.
    """
    api_key = os.getenv("LEMON_SQUEEZY_API_KEY")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.lemonsqueezy.com/v1/checkouts",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/vnd.api+json"
            },
            json={
                "data": {
                    "type": "checkouts",
                    "attributes": {
                        "checkout_data": {
                            "custom": {
                                "restaurant_id": restaurant_id  # Pass to webhook
                            }
                        }
                    },
                    "relationships": {
                        "variant": {
                            "data": {
                                "type": "variants",
                                "id": str(variant_id)
                            }
                        }
                    }
                }
            }
        )

    checkout = response.json()
    return checkout["data"]["attributes"]["url"]
```

### Key Points

1. **Signature Header**: `X-Signature` contains HMAC-SHA256 hex digest
2. **Custom Data**: Pass `restaurant_id` in checkout `custom` field; received in webhook `meta.custom_data`
3. **Idempotency**: Check `lemon_event_id` (event_name + subscription_id) before processing
4. **Event Types**: `subscription_payment_success`, `subscription_payment_failed`, `subscription_cancelled`
5. **Variant ID**: 1295088 configured with 7-day trial + 5000 PKR first payment + 300 PKR per product usage

### Alternatives Considered

- Third-party library (lemonsqueepy): Too opinionated, designed for MongoDB
- Manual webhook processing without verification: Security risk

### Sources

- [Lemon Squeezy Webhook Documentation](https://context7.com/mthli/lemonsqueepy/llms.txt)
- [Lemon Squeezy API Reference](https://docs.lemonsqueezy.com/api)

---

## 4. Cloudinary Python SDK

### Decision

Use official Cloudinary Python SDK for image/video uploads. Store `public_id` in database for asset management and deletion.

### Configuration

```python
import cloudinary
import cloudinary.uploader
import os

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
```

### Upload Implementation

```python
from cloudinary.uploader import upload, destroy

async def upload_image_to_cloudinary(file_bytes: bytes, restaurant_id: str, filename: str) -> dict:
    """
    Upload image to Cloudinary and return URL + public_id.
    Returns: {"url": "https://...", "public_id": "..."}
    """
    result = upload(
        file_bytes,
        folder=f"foodar/{restaurant_id}",  # Organize by restaurant
        public_id=filename.split('.')[0],  # Use filename without extension
        resource_type="image",
        transformation=[
            {"width": 1200, "height": 1200, "crop": "limit"},  # Max dimensions
            {"quality": "auto"},  # Automatic quality optimization
            {"fetch_format": "auto"}  # Automatic format (WebP for browsers that support it)
        ]
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }

async def upload_video_to_cloudinary(file_bytes: bytes, restaurant_id: str, filename: str) -> dict:
    """Upload video to Cloudinary"""
    result = upload(
        file_bytes,
        folder=f"foodar/{restaurant_id}",
        public_id=filename.split('.')[0],
        resource_type="video",
        transformation=[
            {"width": 1920, "height": 1080, "crop": "limit"},
            {"quality": "auto"}
        ]
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }

async def delete_from_cloudinary(public_id: str, resource_type: str = "image"):
    """Delete asset from Cloudinary using public_id"""
    result = destroy(public_id, resource_type=resource_type)
    return result["result"] == "ok"
```

### Thumbnail Generation

```python
from cloudinary import CloudinaryImage

def get_thumbnail_url(public_id: str, width: int = 300, height: int = 300) -> str:
    """Generate thumbnail URL with Cloudinary transformations"""
    return CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        gravity="auto",  # Smart cropping
        quality="auto",
        fetch_format="auto"
    )
```

### Key Points

1. **Configuration**: Use environment variables for credentials
2. **Secure URLs**: Always use `secure_url` (HTTPS) for production
3. **Folders**: Organize uploads by restaurant ID for better management
4. **Transformations**: Apply during upload for optimization (quality, format, dimensions)
5. **Public ID**: Store in database for deletion and URL generation
6. **Resource Types**: `image`, `video`, `raw` (for documents)

### Alternatives Considered

- Direct S3 upload to Supabase Storage: Less powerful transformation capabilities
- Local file storage: Not scalable, no CDN

### Sources

- [Cloudinary Python SDK Documentation](https://cloudinary.com/documentation/python_quickstart)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [PyPI cloudinary package](https://pypi.org/project/cloudinary/)

---

## 5. Resend Email API

### Decision

Use Resend Python SDK for transactional email sending. Simple, developer-friendly API with good deliverability.

### Configuration

```python
import resend
import os

# Set API key
resend.api_key = os.getenv("RESEND_API_KEY")
```

### Email Sending Implementation

```python
from resend import Emails

async def send_trial_reminder_email(email: str, restaurant_name: str, days_left: int):
    """Send trial expiration reminder email"""
    try:
        response = resend.Emails.send({
            "from": "Foodar <noreply@foodar.pk>",
            "to": [email],
            "subject": f"Your Foodar trial expires in {days_left} days",
            "html": f"""
            <h1>Hi from Foodar!</h1>
            <p>Your trial for {restaurant_name} expires in {days_left} days.</p>
            <p>Subscribe now to continue using Foodar AR menus.</p>
            <a href="https://foodar.pk/subscribe">Subscribe Now</a>
            """,
        })
        return response
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

async def send_approval_email(email: str, restaurant_name: str):
    """Send restaurant approval notification"""
    response = resend.Emails.send({
        "from": "Foodar <noreply@foodar.pk>",
        "to": [email],
        "subject": f"{restaurant_name} has been approved!",
        "html": f"""
        <h1>Congratulations!</h1>
        <p>Your restaurant {restaurant_name} has been approved.</p>
        <p>Your 7-day trial starts now. Start adding your 3D models and products!</p>
        <a href="https://foodar.pk/dashboard">Go to Dashboard</a>
        """,
    })
    return response

async def send_payment_failed_email(email: str, restaurant_name: str, grace_days: int):
    """Send payment failure warning"""
    response = resend.Emails.send({
        "from": "Foodar <billing@foodar.pk>",
        "to": [email],
        "subject": "Payment Failed - Action Required",
        "html": f"""
        <h1>Payment Failed</h1>
        <p>We couldn't process your payment for {restaurant_name}.</p>
        <p>You have {grace_days} days to update your payment method before access is suspended.</p>
        <a href="https://foodar.pk/billing">Update Payment Method</a>
        """,
    })
    return response
```

### Background Task Integration

```python
from fastapi import BackgroundTasks

@router.post("/api/v1/admin/restaurants/{restaurant_id}/approve")
async def approve_restaurant(
    restaurant_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Approve restaurant logic...
    restaurant.status = "approved"
    await db.commit()

    # Send email in background
    background_tasks.add_task(
        send_approval_email,
        restaurant.owner.email,
        restaurant.name
    )

    return {"status": "approved"}
```

### Key Points

1. **From Address**: Must be verified domain in Resend dashboard (`noreply@foodar.pk`)
2. **HTML Templates**: Use inline HTML for now; migrate to template engine for complex emails
3. **Background Tasks**: Always send emails in background to avoid blocking API responses
4. **Error Handling**: Catch exceptions and log failures; implement retry logic if needed
5. **Rate Limits**: Free tier: 100 emails/day; paid plans: higher limits

### Alternatives Considered

- SendGrid: More complex API, overkill for simple transactional emails
- AWS SES: Requires more configuration, less developer-friendly
- Built-in SMTP: No deliverability guarantees, requires mail server setup

### Sources

- [Resend Python SDK](https://pypi.org/project/resend/)
- [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Python Guide](https://github.com/resend/resend-python)

---

## 6. FastAPI Async Best Practices

### Decision

Use async SQLAlchemy sessions with FastAPI dependency injection. Implement background tasks for long-running operations. Use middleware for rate limiting and request logging.

### Async Database Sessions

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from fastapi import Depends

# Engine configuration
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Disable SQL logging in production
    pool_size=20,  # Adjust based on expected load
    max_overflow=0,  # No overflow connections
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Dependency with proper cleanup
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Commit if no exceptions
        except Exception:
            await session.rollback()  # Rollback on error
            raise
        finally:
            await session.close()  # Always close session
```

### Background Tasks Pattern

```python
from fastapi import BackgroundTasks
import asyncio

async def check_trial_expirations():
    """Background task to check for trial expirations (run daily)"""
    async with AsyncSessionLocal() as db:
        # Find restaurants with trials expiring in 24 hours
        expiring_soon = await db.execute(
            select(Restaurant).where(
                Restaurant.trial_ends_at <= datetime.utcnow() + timedelta(days=1),
                Restaurant.status == "approved"
            )
        )

        for restaurant in expiring_soon.scalars():
            # Send reminder email
            await send_trial_reminder_email(
                restaurant.owner.email,
                restaurant.name,
                1
            )

# Schedule background task on startup
@app.on_event("startup")
async def startup_event():
    # Option 1: Use APScheduler for scheduled tasks
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(check_trial_expirations, 'cron', hour=0)  # Run daily at midnight
    scheduler.start()
```

### Rate Limiting Middleware

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host

        # Clean old requests (older than 1 minute)
        current_time = time.time()
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < 60
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"}
            )

        # Record request
        self.requests[client_ip].append(current_time)

        response = await call_next(request)
        return response

# Add middleware to app
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
```

### Application Structure

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Foodar Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://foodar.pk", "https://www.foodar.pk"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.v1 import router as v1_router
app.include_router(v1_router, prefix="/api/v1")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Error Response Format

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )
```

### Key Points

1. **Async Everything**: Use async/await for all I/O operations (DB, HTTP, file)
2. **Connection Pooling**: Configure pool_size based on expected concurrent requests
3. **Session Management**: Always use context managers (`async with`) for proper cleanup
4. **Background Tasks**: Use for emails, webhooks processing, scheduled checks
5. **Middleware Order**: CORS → Rate Limiting → Auth → Routes
6. **Error Handling**: Consistent error response format across all endpoints

### Alternatives Considered

- Sync SQLAlchemy: Blocks event loop, poor performance under load
- Celery for background tasks: Overkill for simple scheduled tasks
- Redis for rate limiting: More robust but requires additional infrastructure

### Sources

- [FastAPI SQL Databases](https://github.com/fastapi/fastapi/blob/master/docs/en/docs/tutorial/sql-databases.md)
- [FastAPI Background Tasks](https://github.com/fastapi/fastapi/blob/master/docs/en/docs/tutorial/background-tasks.md)
- [FastAPI Dependencies with Yield](https://github.com/fastapi/fastapi/blob/master/docs/en/docs/tutorial/dependencies/dependencies-with-yield.md)

---

## Summary

All integration patterns have been researched and documented with working code examples. Key takeaways:

1. **Clerk**: Use SDK's `authenticate_request` for JWT verification
2. **Supabase**: SQLAlchemy async for DB, Python client for Storage, RLS for multi-tenancy
3. **Lemon Squeezy**: HMAC-SHA256 webhook verification, custom_data for restaurant_id tracking
4. **Cloudinary**: Official SDK with transformations, store public_id for deletion
5. **Resend**: Simple SDK for transactional emails, background task integration
6. **FastAPI**: Async sessions, dependency injection, background tasks, middleware patterns

All patterns follow FastAPI and async Python best practices for production deployment.
