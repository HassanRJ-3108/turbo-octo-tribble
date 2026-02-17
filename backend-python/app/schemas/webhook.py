"""
Webhook Pydantic Schemas

Models for validating incoming webhook payloads from Clerk and Lemon Squeezy.
"""

from datetime import datetime
from pydantic import BaseModel, model_validator
from typing import Any


# Clerk Webhooks
class ClerkUserData(BaseModel):
    """Clerk user data from webhook"""

    id: str
    email_addresses: list[dict[str, Any]] | None = None  # Optional for deleted events
    first_name: str | None = None
    last_name: str | None = None
    public_metadata: dict[str, Any] | None = None
    deleted: bool | None = None  # Present in user.deleted events


class ClerkWebhook(BaseModel):
    """Clerk webhook payload"""

    type: str
    data: ClerkUserData
    object: str = "event"


# Lemon Squeezy Webhooks
class LemonSqueezyMeta(BaseModel):
    """Lemon Squeezy webhook metadata"""

    event_name: str
    custom_data: dict[str, Any] | None = None
    test_mode: bool | None = None
    webhook_id: str | None = None


class LemonSqueezyAttributes(BaseModel):
    """
    Lemon Squeezy attributes - flexible to handle both
    subscription events AND subscription-invoice events.
    """
    model_config = {"extra": "allow"}

    store_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    # Subscription-specific fields (not present in invoice events)
    customer_id: int | None = None
    variant_id: int | None = None
    product_id: int | None = None
    order_id: int | None = None
    product_name: str | None = None
    variant_name: str | None = None
    user_email: str | None = None
    user_name: str | None = None
    renews_at: datetime | None = None
    ends_at: datetime | None = None
    trial_ends_at: datetime | None = None
    cancelled: bool | None = None
    test_mode: bool | None = None
    card_last_four: str | None = None
    status_formatted: str | None = None
    first_subscription_item: dict[str, Any] | None = None

    # Invoice-specific fields
    total: int | None = None
    currency: str | None = None
    subscription_id: int | None = None
    billing_reason: str | None = None


class LemonSqueezyData(BaseModel):
    """Lemon Squeezy data object"""

    type: str  # "subscriptions" or "subscription-invoices"
    id: str
    attributes: LemonSqueezyAttributes


class LemonSqueezyWebhook(BaseModel):
    """Lemon Squeezy webhook payload"""

    meta: LemonSqueezyMeta
    data: LemonSqueezyData
