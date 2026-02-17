"""
Restaurant Onboarding Pydantic Schemas

Request and response models for onboarding endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class OnboardingBase(BaseModel):
    """Base onboarding schema"""

    phone: str = Field(..., min_length=1, max_length=50)
    address: str = Field(..., min_length=1)
    description: str | None = None
    documents: dict | None = None
    photos: list[str] | None = None


class OnboardingSubmit(OnboardingBase):
    """Schema for submitting onboarding application"""

    restaurant_name: str = Field(..., min_length=1, max_length=255)
    restaurant_slug: str = Field(..., min_length=3, max_length=100)


class OnboardingRead(OnboardingBase):
    """Schema for reading onboarding data"""

    id: UUID
    restaurant_id: UUID
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
