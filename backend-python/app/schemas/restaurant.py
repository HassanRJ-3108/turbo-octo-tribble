"""
Restaurant Pydantic Schemas

Request and response models for restaurant endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
import re


class RestaurantBase(BaseModel):
    """Base restaurant schema"""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=3, max_length=100)
    custom_domain: str | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug format: lowercase, alphanumeric, hyphens only"""
        if not re.match(r"^[a-z0-9-]{3,50}$", v):
            raise ValueError(
                "Slug must be 3-50 characters, lowercase, alphanumeric with hyphens only"
            )
        return v


class RestaurantCreate(RestaurantBase):
    """Schema for creating a restaurant"""

    pass


class RestaurantRead(RestaurantBase):
    """Schema for reading restaurant data"""

    id: UUID
    owner_id: UUID
    status: str
    trial_starts_at: datetime | None = None
    trial_ends_at: datetime | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RestaurantUpdate(BaseModel):
    """Schema for updating restaurant data"""

    name: str | None = Field(None, min_length=1, max_length=255)
    custom_domain: str | None = None
    status: str | None = None
