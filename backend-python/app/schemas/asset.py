"""
Asset Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class AssetBase(BaseModel):
    """Base asset schema"""

    url: str
    public_id: str
    type: str


class AssetCreate(AssetBase):
    """Schema for creating asset"""

    pass


class AssetRead(AssetBase):
    """Schema for reading asset data"""

    id: UUID
    restaurant_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
