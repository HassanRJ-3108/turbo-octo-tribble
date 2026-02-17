"""
Webhook API Endpoints

Handles incoming webhooks from Clerk and Lemon Squeezy.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.webhook import ClerkWebhook, LemonSqueezyWebhook
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.subscription import Subscription
from app.models.webhook_event import WebhookEvent
from app.services.lemon_squeezy import verify_lemon_squeezy_webhook

router = APIRouter()


@router.post("/webhooks/clerk")
async def clerk_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Handle Clerk user lifecycle webhooks.

    Events: user.created, user.updated, user.deleted
    
    Includes Svix signature verification for security.
    """
    print(f"🔔 Received Clerk webhook request")
    
    try:
        # Verify Svix signature
        from svix.webhooks import Webhook, WebhookVerificationError
        from app.config import settings
        
        # Get headers for verification
        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature")
        
        print(f"📋 Headers - ID: {svix_id}, TS: {svix_timestamp}, Sig: {svix_signature[:20] if svix_signature else None}...")
        
        if not all([svix_id, svix_timestamp, svix_signature]):
            print("❌ Missing Svix headers!")
            raise HTTPException(
                status_code=401,
                detail="Missing Svix headers"
            )
        
        # Get raw body for verification
        body = await request.body()
        print(f"📦 Body length: {len(body)} bytes")
        
        # Verify signature
        try:
            wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
            payload = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            })
            print(f"✅ Webhook signature verified!")
        except WebhookVerificationError as e:
            print(f"❌ Webhook verification failed: {str(e)}")
            raise HTTPException(status_code=401, detail=f"Webhook verification failed: {str(e)}")
        
        # Parse webhook
        webhook = ClerkWebhook(**payload)
        print(f"📨 Webhook type: {webhook.type}, User ID: {webhook.data.id}")
    
    except Exception as e:
        print(f"💥 ERROR processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

    # Log event
    event = WebhookEvent(
        provider="clerk",
        event_name=webhook.type,
        raw_payload=payload,
        processed=False,
    )
    db.add(event)
    await db.commit()

    # Process event
    if webhook.type == "user.created":
        # Create user in database (with duplicate check)
        # Check if user already exists (handles race conditions)
        result = await db.execute(
            select(User).where(User.clerk_user_id == webhook.data.id)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"⚠️  User already exists, skipping creation: {webhook.data.id}")
        else:
            email = (
                webhook.data.email_addresses[0]["email_address"]
                if webhook.data.email_addresses
                else None
            )
            # Handle full_name - concatenate whatever is available
            name_parts = []
            if webhook.data.first_name:
                name_parts.append(webhook.data.first_name)
            if webhook.data.last_name:
                name_parts.append(webhook.data.last_name)
            full_name = " ".join(name_parts) if name_parts else None

            role = "restaurant_owner"
            if webhook.data.public_metadata:
                role = webhook.data.public_metadata.get("role", "restaurant_owner")

            print(f"🆕 Creating new user: {webhook.data.id}")
            user = User(
                clerk_user_id=webhook.data.id,
                email=email,
                full_name=full_name,
                role=role,
            )
            db.add(user)

    elif webhook.type == "user.updated":
        # Update or create user (upsert logic)
        result = await db.execute(
            select(User).where(User.clerk_user_id == webhook.data.id)
        )
        user = result.scalar_one_or_none()

        # Extract user data from webhook
        email = (
            webhook.data.email_addresses[0]["email_address"]
            if webhook.data.email_addresses
            else None
        )
        # Handle full_name - concatenate whatever is available
        name_parts = []
        if webhook.data.first_name:
            name_parts.append(webhook.data.first_name)
        if webhook.data.last_name:
            name_parts.append(webhook.data.last_name)
        full_name = " ".join(name_parts) if name_parts else None
        
        role = "restaurant_owner"
        if webhook.data.public_metadata:
            role = webhook.data.public_metadata.get("role", "restaurant_owner")

        if user:
            # User exists - update fields
            print(f"📝 Updating existing user: {user.clerk_user_id}")
            if email:
                user.email = email
            if full_name:
                user.full_name = full_name
            user.role = role
        else:
            # User doesn't exist - create new user
            # This handles out-of-order webhook events
            print(f"🆕 Creating user from update event: {webhook.data.id}")
            user = User(
                clerk_user_id=webhook.data.id,
                email=email,
                full_name=full_name,
                role=role,
            )
            db.add(user)

    elif webhook.type == "user.deleted":
        # Delete user (cascades to restaurants, etc.)
        result = await db.execute(
            select(User).where(User.clerk_user_id == webhook.data.id)
        )
        user = result.scalar_one_or_none()

        if user:
            await db.delete(user)

    # Mark event as processed
    event.processed = True
    event.processed_at = datetime.utcnow()

    await db.commit()

    return {"status": "processed", "event_type": webhook.type}


@router.post("/webhooks/lemon-squeezy")
async def lemon_squeezy_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Handle Lemon Squeezy subscription webhooks.

    Handles: subscription_created, subscription_updated,
    subscription_payment_success, subscription_payment_failed,
    subscription_cancelled, subscription_expired
    """
    print(f"💰 Received Lemon Squeezy webhook request")
    
    try:
        # Verify signature
        payload = await verify_lemon_squeezy_webhook(request)
        print(f"✅ Lemon Squeezy signature verified!")
        
        # Parse webhook
        webhook = LemonSqueezyWebhook(**payload)
        event_name = webhook.meta.event_name
        print(f"📨 Webhook event: {event_name}, ID: {webhook.data.id}, type: {webhook.data.type}")
    except Exception as e:
        print(f"💥 ERROR parsing Lemon Squeezy webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

    # Generate unique event ID for idempotency
    event_id = f"{event_name}_{webhook.data.id}"

    # Check if already processed
    result = await db.execute(
        select(WebhookEvent).where(WebhookEvent.lemon_event_id == event_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        return {"status": "duplicate", "message": "Event already processed"}

    # Log event
    event = WebhookEvent(
        provider="lemon_squeezy",
        event_name=event_name,
        lemon_event_id=event_id,
        raw_payload=payload,
        processed=False,
    )
    db.add(event)
    await db.commit()

    # Get restaurant from custom_data
    restaurant_id = None
    if webhook.meta.custom_data:
        restaurant_id = webhook.meta.custom_data.get("restaurant_id")

    if not restaurant_id:
        print(f"❌ Missing restaurant_id in custom_data!")
        event.processed = True
        event.processed_at = datetime.utcnow()
        await db.commit()
        raise HTTPException(status_code=400, detail="Missing restaurant_id in custom_data")
    
    print(f"🏪 Processing for restaurant: {restaurant_id}")

    # Verify restaurant exists
    restaurant_result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = restaurant_result.scalar_one_or_none()
    
    if not restaurant:
        print(f"❌ Restaurant not found: {restaurant_id}")
        event.processed = True
        event.processed_at = datetime.utcnow()
        await db.commit()
        raise HTTPException(status_code=404, detail=f"Restaurant not found: {restaurant_id}")

    # Get or create subscription
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        print(f"🆕 Creating new subscription for restaurant: {restaurant_id}")
        subscription = Subscription(
            restaurant_id=restaurant_id,
            status="inactive",  # Will be updated by webhook logic below
        )
        db.add(subscription)
        await db.flush()  # Get the ID without committing
        print(f"✅ Created subscription: {subscription.id}")
    else:
        print(f"📋 Found existing subscription: {subscription.id}, current status: {subscription.status}")

    # Map Lemon Squeezy status to our internal status
    # LS statuses: on_trial, active, paused, past_due, unpaid, cancelled, expired
    LS_STATUS_MAP = {
        "on_trial": "active",      # Trial = active for us (features unlocked)
        "active": "active",
        "paused": "paused",
        "past_due": "past_due",
        "unpaid": "past_due",
        "cancelled": "cancelled",
        "expired": "expired",
    }

    # Process based on event type
    if event_name in ["subscription_created", "subscription_updated"]:
        ls_status = webhook.data.attributes.status
        mapped_status = LS_STATUS_MAP.get(ls_status, ls_status)
        print(f"📊 LS status: '{ls_status}' → mapped to: '{mapped_status}'")
        
        # Check if this is first-time subscription (no lemon_subscription_id yet)
        is_first_subscription = subscription.lemon_subscription_id is None
        
        subscription.status = mapped_status
        subscription.lemon_subscription_id = webhook.data.id
        
        # Capture subscription item ID for usage-based billing
        if webhook.data.attributes.first_subscription_item:
            item_id = webhook.data.attributes.first_subscription_item.get("id")
            if item_id:
                subscription.lemon_subscription_item_id = str(item_id)
                print(f"📦 Captured subscription item ID: {item_id}")
        
        # Calculate bill amount: setup fee (first time only) + monthly usage
        SETUP_FEE = 4999  # One-time setup fee in PKR
        PRICE_PER_PRODUCT = 300  # Monthly price per active product in PKR
        
        setup_fee = SETUP_FEE if is_first_subscription else 0
        monthly_usage = subscription.active_products_count * PRICE_PER_PRODUCT
        total_bill = setup_fee + monthly_usage
        
        subscription.next_bill_amount = total_bill
        
        print(f"💰 Bill calculation: setup={setup_fee}, usage={monthly_usage} ({subscription.active_products_count} products × {PRICE_PER_PRODUCT}), total={total_bill}")
        print(f"✅ Subscription updated to: {mapped_status}")

    elif event_name == "subscription_payment_success":
        print(f"💳 Payment successful!")
        subscription.status = "active"
        subscription.last_billed_at = datetime.utcnow()
        subscription.grace_end_at = None
        subscription.warning_count = 0
        
        # Get subscription_id from invoice if available
        if webhook.data.attributes.subscription_id:
            subscription.lemon_subscription_id = str(webhook.data.attributes.subscription_id)
        
        # Recalculate next bill (no setup fee, only usage)
        PRICE_PER_PRODUCT = 300
        monthly_usage = subscription.active_products_count * PRICE_PER_PRODUCT
        subscription.next_bill_amount = monthly_usage
        
        print(f"💰 Next bill amount: {monthly_usage} ({subscription.active_products_count} products × {PRICE_PER_PRODUCT})")
        print(f"✅ Subscription activated via payment")

    elif event_name == "subscription_payment_failed":
        print(f"❌ Payment failed - setting grace period (3 days)")
        subscription.status = "past_due"
        from datetime import timedelta
        subscription.grace_end_at = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=3)
        subscription.warning_count = (subscription.warning_count or 0) + 1

    elif event_name in ["subscription_cancelled", "subscription_expired"]:
        print(f"🚫 Subscription {event_name}")
        subscription.status = "cancelled" if "cancelled" in event_name else "expired"
    
    else:
        print(f"ℹ️  Unhandled event type: {event_name} - storing but not processing")

    # Mark event as processed
    event.processed = True
    event.processed_at = datetime.utcnow()

    await db.commit()
    print(f"✅ Event {event_name} processed successfully")

    return {"status": "processed", "event_type": event_name}

