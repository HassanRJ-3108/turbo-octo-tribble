"""
Models3D Model

Represents 3D model files stored in Supabase Storage.
"""

from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.base import Base


class Models3D(Base):
    __tablename__ = "models_3d"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    storage_provider: Mapped[str] = mapped_column(
        String(20), nullable=False, default="supabase"
    )  # "supabase" or "cloudinary"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Physical dimensions for true-to-scale AR rendering
    height: Mapped[float | None] = mapped_column(Float, nullable=True)  # in cm
    width: Mapped[float | None] = mapped_column(Float, nullable=True)   # in cm
    depth: Mapped[float | None] = mapped_column(Float, nullable=True)   # in cm
    dimension_unit: Mapped[str] = mapped_column(
        String(10), nullable=False, default="cm"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="models_3d")
    products: Mapped[list["Product"]] = relationship(back_populates="ar_model")
