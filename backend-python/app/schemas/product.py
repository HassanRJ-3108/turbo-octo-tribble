"""
Product Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class ProductBase(BaseModel):
    """Base product schema"""

    title: str = Field(..., min_length=1, max_length=255)
    subtitle: str | None = Field(None, max_length=255)
    description: str | None = None
    price_amount: int = Field(..., ge=0)
    currency: str = Field(default="PKR", max_length=3)
    nutrition: dict | None = None
    ingredients: list[str] | None = None
    dietary: dict | None = None
    media: dict | None = None
    ui_behavior: dict | None = None
    active: bool = True
    show_in_menu: bool = True
    order_index: int = 0


class ProductCreate(ProductBase):
    """Schema for creating product"""

    ar_model_id: UUID | None = None


class ProductRead(ProductBase):
    """Schema for reading product data"""

    id: UUID
    restaurant_id: UUID
    ar_model_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    """Schema for updating product"""

    title: str | None = Field(None, min_length=1, max_length=255)
    subtitle: str | None = Field(None, max_length=255)
    description: str | None = None
    price_amount: int | None = Field(None, ge=0)
    currency: str | None = Field(None, max_length=3)
    nutrition: dict | None = None
    ingredients: list[str] | None = None
    dietary: dict | None = None
    media: dict | None = None
    ui_behavior: dict | None = None
    ar_model_id: UUID | None = None
    active: bool | None = None
    show_in_menu: bool | None = None
    order_index: int | None = None
