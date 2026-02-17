"""
Slug Generation and Validation

Utilities for generating and validating URL-safe slugs for restaurants.
"""

import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def generate_slug(name: str) -> str:
    """
    Generate URL-safe slug from restaurant name.

    Args:
        name: Restaurant name

    Returns:
        str: URL-safe slug (lowercase, alphanumeric with hyphens)

    Examples:
        "The Best Restaurant" -> "the-best-restaurant"
        "Café Délicious!" -> "cafe-delicious"
    """
    # Convert to lowercase
    slug = name.lower()

    # Remove accents and special characters
    slug = (
        slug.replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("ô", "o")
        .replace("ç", "c")
    )

    # Replace spaces and non-alphanumeric with hyphens
    slug = re.sub(r"[^a-z0-9]+", "-", slug)

    # Remove leading/trailing hyphens
    slug = slug.strip("-")

    # Ensure within length limits
    if len(slug) > 50:
        slug = slug[:50].rstrip("-")

    return slug


def validate_slug_format(slug: str) -> bool:
    """
    Validate slug format.

    Args:
        slug: Slug to validate

    Returns:
        bool: True if valid format
    """
    pattern = r"^[a-z0-9-]{3,50}$"
    return bool(re.match(pattern, slug))


async def is_slug_available(db: AsyncSession, slug: str) -> bool:
    """
    Check if slug is available (not already taken).

    Args:
        db: Database session
        slug: Slug to check

    Returns:
        bool: True if available
    """
    from app.models.restaurant import Restaurant

    result = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
    existing = result.scalar_one_or_none()
    return existing is None


async def generate_unique_slug(
    db: AsyncSession, base_slug: str, max_attempts: int = 10
) -> str:
    """
    Generate unique slug by appending numbers if needed.

    Args:
        db: Database session
        base_slug: Base slug to start with
        max_attempts: Maximum attempts to find unique slug

    Returns:
        str: Unique slug

    Raises:
        ValueError: If unable to generate unique slug after max_attempts
    """
    slug = base_slug

    for i in range(max_attempts):
        if await is_slug_available(db, slug):
            return slug

        # Append number for uniqueness
        slug = f"{base_slug}-{i + 2}"

    raise ValueError(f"Unable to generate unique slug from '{base_slug}'")
