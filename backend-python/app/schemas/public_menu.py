"""
Public Menu Pydantic Schemas

Response models for public menu endpoints (no authentication required).
"""

from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class ProductPublic(BaseModel):
    """Public product data (subset of full product)"""

    id: UUID
    title: str
    subtitle: str | None
    description: str | None
    price_amount: int
    currency: str
    nutrition: dict | None
    ingredients: list[str] | None
    dietary: dict | None
    media: dict | None
    ui_behavior: dict | None
    ar_model_id: UUID | None
    ar_model: "ARModelPublic | None" = None
    order_index: int

    model_config = {"from_attributes": True}


class ARModelPublic(BaseModel):
    """Public AR model data"""

    id: UUID
    name: str
    file_url: str
    thumbnail_url: str | None
    height: float | None
    width: float | None
    depth: float | None
    dimension_unit: str = "cm"

    model_config = {"from_attributes": True}


class PublicMenuResponse(BaseModel):
    """Public menu response"""

    restaurant_name: str
    slug: str
    status: str
    products: list[ProductPublic]
    total_products: int
