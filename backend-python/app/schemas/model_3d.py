"""
3D Model Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class Model3DBase(BaseModel):
    """Base 3D model schema"""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    height: float | None = Field(None, gt=0, description="Height in cm")
    width: float | None = Field(None, gt=0, description="Width in cm")
    depth: float | None = Field(None, gt=0, description="Depth in cm")
    dimension_unit: str = Field(default="cm", max_length=10)


class Model3DCreate(Model3DBase):
    """Schema for creating 3D model"""

    pass


class Model3DRead(Model3DBase):
    """Schema for reading 3D model data"""

    id: UUID
    restaurant_id: UUID
    storage_path: str
    file_url: str
    thumbnail_url: str | None
    storage_provider: str = "supabase"
    height: float | None = None
    width: float | None = None
    depth: float | None = None
    dimension_unit: str = "cm"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class Model3DUpload(BaseModel):
    """Schema for 3D model upload"""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
