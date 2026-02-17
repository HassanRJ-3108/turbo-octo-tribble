"""
Lemon Squeezy Service Integration

Provides utilities for Lemon Squeezy payment integration including:
- Webhook signature verification (HMAC-SHA256)
- Checkout session creation
- Subscription management
"""

import hmac
import hashlib
import httpx

from fastapi import Request, HTTPException
from app.config import settings


async def verify_lemon_squeezy_webhook(request: Request) -> dict:
    """
    Verify Lemon Squeezy webhook signature and return parsed payload.

    Args:
        request: FastAPI Request object

    Returns:
        dict: Parsed webhook payload

    Raises:
        HTTPException: 401 if signature is invalid or missing
    """
    # Get signature from header
    signature = request.headers.get("X-Signature")
    if not signature:
        raise HTTPException(
            status_code=401, detail="Missing X-Signature header"
        )

    # Get raw body
    raw_body = await request.body()
    secret = settings.LEMON_SQUEEZY_WEBHOOK_SECRET

    # Compute HMAC-SHA256 signature
    computed_signature = hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()

    # Compare signatures (constant-time comparison)
    if not hmac.compare_digest(signature, computed_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Parse and return JSON payload
    payload = await request.json()
    return payload


async def create_checkout_session(
    variant_id: int, restaurant_id: str, custom_data: dict = None
) -> str:
    """
    Create Lemon Squeezy checkout session.

    Uses JSON:API format as per official docs:
    https://docs.lemonsqueezy.com/api/checkouts/create-checkout

    Args:
        variant_id: Lemon Squeezy variant ID
        restaurant_id: Restaurant UUID to pass in custom_data
        custom_data: Additional custom data for webhook

    Returns:
        str: Checkout URL for user to complete payment
    """
    api_key = settings.LEMON_SQUEEZY_API_KEY
    store_id = str(settings.LEMON_SQUEEZY_STORE_ID)

    # Prepare custom data - ALL values must be strings per LS API
    checkout_custom_data = {"restaurant_id": str(restaurant_id)}
    if custom_data:
        checkout_custom_data.update({k: str(v) for k, v in custom_data.items()})

    # Determine if test mode based on environment
    is_test = settings.ENVIRONMENT == "development"

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "product_options": {
                    "enabled_variants": [variant_id],
                },
                "checkout_data": {
                    "custom": checkout_custom_data
                },
                "test_mode": is_test,
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": store_id,
                    }
                },
                "variant": {
                    "data": {
                        "type": "variants",
                        "id": str(variant_id),
                    }
                }
            },
        }
    }

    print(f"🛒 Creating checkout: store={store_id}, variant={variant_id}, test_mode={is_test}")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.lemonsqueezy.com/v1/checkouts",
                headers={
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                    "Authorization": f"Bearer {api_key}",
                },
                json=payload,
                timeout=15.0,
            )

            print(f"📝 Lemon Squeezy Response: {response.status_code}")
            if response.status_code != 201:
                print(f"❌ Error Response: {response.text}")

            response.raise_for_status()
            checkout = response.json()
            checkout_url = checkout["data"]["attributes"]["url"]
            print(f"✅ Checkout URL created: {checkout_url}")
            return checkout_url
        except httpx.HTTPStatusError as e:
            print(f"❌ Lemon Squeezy HTTP Error {e.response.status_code}: {e.response.text}")
            raise
            print(f"❌ Lemon Squeezy Error: {e}")
            raise


async def report_usage(subscription_item_id: str, quantity: int) -> None:
    """
    Report usage to Lemon Squeezy for usage-based billing.

    Args:
        subscription_item_id: The ID of the subscription item to report usage for
        quantity: The total number of units (active products)

    Returns:
        None
    """
    if not subscription_item_id:
        print("⚠️ No subscription item ID provided for usage reporting - skipping")
        return

    api_key = settings.LEMON_SQUEEZY_API_KEY

    print(f"📊 Reporting usage to Lemon Squeezy: item={subscription_item_id}, quantity={quantity}")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.lemonsqueezy.com/v1/usage-records",
                headers={
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "data": {
                        "type": "usage-records",
                        "attributes": {
                            "quantity": quantity,
                            "action": "set",  # 'set' overrides previous value, 'increment' adds to it
                        },
                        "relationships": {
                            "subscription-item": {
                                "data": {
                                    "type": "subscription-items",
                                    "id": str(subscription_item_id),
                                }
                            }
                        },
                    }
                },
            )

            if response.status_code != 201:
                print(f"❌ Failed to report usage: {response.status_code} - {response.text}")
            else:
                print(f"✅ Usage reported successfully: {quantity}")

        except Exception as e:
            print(f"❌ Error reporting usage to Lemon Squeezy: {e}")
            # Don't raise, just log error so we don't block the main flow


