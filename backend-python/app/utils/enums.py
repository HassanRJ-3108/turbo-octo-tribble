"""
Application Enums

Defines all enumeration types used across the application for restaurant status,
subscription status, asset types, and other categorical data.
"""

from enum import Enum


class RestaurantStatus(str, Enum):
    """Restaurant account status"""

    PENDING = "pending"  # Onboarding application submitted, awaiting admin review
    APPROVED = "approved"  # Approved by admin, trial period active
    REJECTED = "rejected"  # Application rejected by admin
    SUSPENDED = "suspended"  # Account suspended for policy violation
    ACTIVE = "active"  # Active paid subscription
    INACTIVE = "inactive"  # Subscription cancelled or expired


class SubscriptionStatus(str, Enum):
    """Subscription billing status"""

    TRIALING = "trialing"  # 7-day trial period active
    ACTIVE = "active"  # Paid subscription active
    PAST_DUE = "past_due"  # Payment failed, in grace period
    CANCELLED = "cancelled"  # Subscription cancelled by user
    EXPIRED = "expired"  # Trial or subscription expired


class AssetType(str, Enum):
    """Asset media types"""

    IMAGE = "image"  # Product images, restaurant photos
    VIDEO = "video"  # Product videos
    DOCUMENT = "document"  # PDF documents, onboarding files
    MODEL_3D = "3d_model"  # 3D model files (.glb, .gltf, .usdz)


class WebhookProvider(str, Enum):
    """External webhook providers"""

    CLERK = "clerk"  # Clerk user management webhooks
    LEMON_SQUEEZY = "lemon_squeezy"  # Lemon Squeezy payment webhooks


class UserRole(str, Enum):
    """User role for authorization"""

    RESTAURANT_OWNER = "restaurant_owner"  # Restaurant owner/operator
    ADMIN = "admin"  # Platform administrator
