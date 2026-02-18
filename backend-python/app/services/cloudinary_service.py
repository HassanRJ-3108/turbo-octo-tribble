"""
Cloudinary Service Integration

Provides utilities for uploading, transforming, and managing media assets in Cloudinary.
Used for product images, videos, and thumbnails.
"""

import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage

from app.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_image(
    file_bytes: bytes, restaurant_id: str, filename: str
) -> dict:
    """
    Upload image to Cloudinary with optimization transformations.

    Args:
        file_bytes: Image file content as bytes
        restaurant_id: Restaurant UUID for folder organization
        filename: Original filename (without extension)

    Returns:
        dict: {"url": str, "public_id": str}

    Raises:
        Exception: If upload fails
    """
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"foodar/{restaurant_id}",
            public_id=filename.split(".")[0],
            resource_type="image",
            transformation=[
                {"width": 1200, "height": 1200, "crop": "limit"},
                {"quality": "auto"},
                {"fetch_format": "auto"},
            ],
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        print(f"Failed to upload image to Cloudinary: {e}")
        raise


def upload_video(
    file_bytes: bytes, restaurant_id: str, filename: str
) -> dict:
    """
    Upload video to Cloudinary with optimization transformations.

    Args:
        file_bytes: Video file content as bytes
        restaurant_id: Restaurant UUID for folder organization
        filename: Original filename (without extension)

    Returns:
        dict: {"url": str, "public_id": str}
    """
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"foodar/{restaurant_id}",
            public_id=filename.split(".")[0],
            resource_type="video",
            transformation=[
                {"width": 1920, "height": 1080, "crop": "limit"},
                {"quality": "auto"},
            ],
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        print(f"Failed to upload video to Cloudinary: {e}")
        raise


def delete_asset(public_id: str, resource_type: str = "image") -> bool:
    """
    Delete asset from Cloudinary.

    Args:
        public_id: Cloudinary public_id of the asset
        resource_type: "image" or "video"

    Returns:
        bool: True if deletion successful
    """
    try:
        result = cloudinary.uploader.destroy(
            public_id, resource_type=resource_type
        )
        return result["result"] == "ok"
    except Exception as e:
        print(f"Failed to delete asset from Cloudinary: {e}")
        return False


def get_thumbnail_url(
    public_id: str, width: int = 300, height: int = 300
) -> str:
    """
    Generate thumbnail URL with Cloudinary transformations.

    Args:
        public_id: Cloudinary public_id
        width: Thumbnail width in pixels
        height: Thumbnail height in pixels

    Returns:
        str: Thumbnail URL
    """
    return CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        gravity="auto",
        quality="auto",
        fetch_format="auto",
    )


def upload_3d_model(
    file_bytes: bytes, restaurant_id: str, model_id: str, filename: str
) -> dict:
    """
    Upload 3D model file to Cloudinary as a raw asset.

    Cloudinary treats GLB/GLTF/USDZ as raw resource types.

    Args:
        file_bytes: 3D model file content as bytes
        restaurant_id: Restaurant UUID for folder organization
        model_id: Model UUID for unique public_id
        filename: Original filename

    Returns:
        dict: {"url": str, "public_id": str, "storage_path": str}

    Raises:
        Exception: If upload fails
    """
    try:
        # Use the filename extension for the public_id
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"foodar/{restaurant_id}/models",
            public_id=model_id,
            resource_type="raw",
            # Keep original format (GLB, GLTF, USDZ)
            use_filename=False,
            unique_filename=False,
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "storage_path": f"cloudinary:{result['public_id']}",
        }
    except Exception as e:
        print(f"Failed to upload 3D model to Cloudinary: {e}")
        raise


def upload_thumbnail(
    file_bytes: bytes, restaurant_id: str, model_id: str
) -> dict:
    """
    Upload model thumbnail image to Cloudinary.

    Args:
        file_bytes: Thumbnail image content as bytes
        restaurant_id: Restaurant UUID for folder organization
        model_id: Model UUID for unique naming

    Returns:
        dict: {"url": str, "public_id": str}
    """
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"foodar/{restaurant_id}/thumbnails",
            public_id=f"thumb_{model_id}",
            resource_type="image",
            transformation=[
                {"width": 400, "height": 400, "crop": "limit"},
                {"quality": "auto"},
                {"fetch_format": "auto"},
            ],
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        print(f"Failed to upload thumbnail to Cloudinary: {e}")
        raise
