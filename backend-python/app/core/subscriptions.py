"""
Subscription Business Logic

Functions for checking subscription validity.
Trials are handled by Lemon Squeezy after subscription - no backend trial logic.
"""

from datetime import datetime, timezone
from app.models.subscription import Subscription
from app.models.restaurant import Restaurant


def is_subscription_active(subscription: Subscription | None) -> bool:
    """
    Check if subscription is in good standing (active).

    Lemon Squeezy handles trials internally. When a user subscribes with a trial,
    the subscription status will be 'active' from Lemon Squeezy's webhook.

    Args:
        subscription: Subscription model instance

    Returns:
        bool: True if subscription allows access
    """
    if not subscription:
        return False

    return subscription.status in ["active", "trialing"]


def is_trial_active(restaurant: Restaurant) -> bool:
    """
    Check if restaurant's trial period is currently active.

    Args:
        restaurant: Restaurant model instance

    Returns:
        bool: True if trial is active
    """
    if not restaurant.trial_starts_at or not restaurant.trial_ends_at:
        return False

    now = datetime.now(timezone.utc)
    return restaurant.trial_starts_at <= now <= restaurant.trial_ends_at


def can_access_features(
    restaurant: Restaurant, subscription: Subscription | None
) -> bool:
    """
    Check if restaurant can access protected features.

    Access allowed during trial period OR with active subscription.

    Args:
        restaurant: Restaurant model instance
        subscription: Subscription model instance

    Returns:
        bool: True if access allowed
    """
    # Must be approved
    if restaurant.status != "approved":
        return False

    # Check trial
    if is_trial_active(restaurant):
        return True

    # Check subscription
    if is_subscription_active(subscription):
        return True

    return False
