"""
User Pydantic Schemas

Request and response models for user endpoints.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema with common fields"""

    email: EmailStr
    full_name: str | None = None
    role: str = "restaurant_owner"


class UserCreate(UserBase):
    """Schema for creating a new user"""

    clerk_user_id: str = Field(..., min_length=1, max_length=255)


class UserRead(UserBase):
    """Schema for reading user data"""

    id: UUID
    clerk_user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating user data"""

    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None
