"""
SQLAlchemy declarative base

All models should inherit from this Base class.
Import all models here to ensure they're registered with Alembic.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy declarative base class"""

    pass


# Import all models here to ensure they're registered with Alembic
# This allows Alembic to auto-generate migrations from model changes

# from app.models.user import User
# from app.models.restaurant import Restaurant
# from app.models.onboarding import RestaurantOnboarding
# from app.models.subscription import Subscription
# from app.models.webhook_event import WebhookEvent
# from app.models.model_3d import Models3D
# from app.models.product import Product
# from app.models.asset import Asset
