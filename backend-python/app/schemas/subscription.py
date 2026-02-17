"""
Subscription Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class SubscriptionRead(BaseModel):
    """Schema for reading subscription data"""

    id: UUID
    restaurant_id: UUID
    lemon_subscription_id: str | None
    status: str
    active_products_count: int
    last_billed_at: datetime | None
    next_bill_amount: int
    grace_end_at: datetime | None
    warning_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CheckoutCreate(BaseModel):
    """Schema for creating checkout session"""

    variant_id: int = 1295088
    custom_data: dict | None = None
