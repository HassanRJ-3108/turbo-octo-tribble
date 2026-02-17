"""
Supabase Storage Service

Provides utilities for uploading, downloading, and managing files in Supabase Storage.
Used for 3D model storage with signed URL generation.
"""

from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client with service key
supabase: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
)

BUCKET_NAME = "3d-models"
_bucket_checked = False


def _ensure_bucket_exists():
    """Create the storage bucket if it doesn't exist."""
    global _bucket_checked
    if _bucket_checked:
        return
    try:
        supabase.storage.get_bucket(BUCKET_NAME)
        print(f"✅ Bucket '{BUCKET_NAME}' exists")
    except Exception:
        try:
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": False})
            print(f"✅ Created bucket '{BUCKET_NAME}'")
        except Exception as e:
            # Might already exist from a race condition
            if "already exists" not in str(e).lower():
                print(f"⚠️ Bucket creation warning: {e}")
    _bucket_checked = True


def upload_3d_model(
    file_bytes: bytes, restaurant_id: str, model_id: str, filename: str
) -> str:
    """
    Upload 3D model file to Supabase Storage.

    Args:
        file_bytes: File content as bytes
        restaurant_id: Restaurant UUID
        model_id: Model UUID
        filename: Original filename

    Returns:
        str: Storage path of uploaded file

    Raises:
        Exception: If upload fails
    """
    _ensure_bucket_exists()

    storage_path = f"{restaurant_id}/models/{model_id}/{filename}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "model/gltf-binary"},
        )
        return storage_path
    except Exception as e:
        print(f"Failed to upload 3D model: {e}")
        raise


def generate_signed_url(storage_path: str, expires_in: int = 604800) -> str:
    """
    Generate signed URL for private storage file.

    Args:
        storage_path: Path in storage bucket
        expires_in: Expiration time in seconds (default: 7 days)

    Returns:
        str: Signed URL for accessing the file
    """
    try:
        result = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            path=storage_path, expires_in=expires_in
        )
        return result["signedURL"]
    except Exception as e:
        print(f"Failed to generate signed URL: {e}")
        raise


def delete_3d_model(storage_path: str) -> bool:
    """
    Delete 3D model from Supabase Storage.

    Args:
        storage_path: Path in storage bucket

    Returns:
        bool: True if deletion successful
    """
    try:
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
        return True
    except Exception as e:
        print(f"Failed to delete 3D model: {e}")
        return False
