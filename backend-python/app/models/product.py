"""
Product Model

Represents menu products with AR capabilities.
"""

from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ar_model_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("models_3d.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="PKR"
    )
    nutrition: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ingredients: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    dietary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    media: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ui_behavior: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    show_in_menu: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, index=True
    )
    order_index: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, index=True
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
    restaurant: Mapped["Restaurant"] = relationship(back_populates="products")
    ar_model: Mapped["Models3D"] = relationship(back_populates="products")
