"""
Custom Validators

Utilities for validating file types, sizes, and other input constraints.
"""

from fastapi import UploadFile, HTTPException


# File size limits (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_3D_MODEL_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024  # 5 MB

# Allowed MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",  # .mov files
}

ALLOWED_3D_MODEL_TYPES = {
    "model/gltf-binary",  # .glb
    "model/gltf+json",  # .gltf
    "model/vnd.usdz+zip",  # .usdz
    "application/octet-stream",  # browsers often send .glb as this
}

# File extensions for 3D models (fallback when MIME type is wrong)
ALLOWED_3D_MODEL_EXTENSIONS = {".glb", ".gltf", ".usdz"}

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}


def validate_file_size(file: UploadFile, max_size: int, file_type: str) -> None:
    """
    Validate file size.

    Args:
        file: Uploaded file
        max_size: Maximum allowed size in bytes
        file_type: Description of file type for error message

    Raises:
        HTTPException: If file exceeds max size
    """
    # Read file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"{file_type} file too large. Maximum size: {max_mb:.1f}MB",
        )


def validate_file_type(
    file: UploadFile, allowed_types: set[str], file_type: str
) -> None:
    """
    Validate file MIME type.

    Args:
        file: Uploaded file
        allowed_types: Set of allowed MIME types
        file_type: Description of file type for error message

    Raises:
        HTTPException: If file type not allowed
    """
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Invalid {file_type} format. Allowed: {', '.join(allowed_types)}",
        )


def validate_image(file: UploadFile) -> None:
    """Validate image file"""
    validate_file_type(file, ALLOWED_IMAGE_TYPES, "image")
    validate_file_size(file, MAX_IMAGE_SIZE, "Image")


def validate_video(file: UploadFile) -> None:
    """Validate video file"""
    validate_file_type(file, ALLOWED_VIDEO_TYPES, "video")
    validate_file_size(file, MAX_VIDEO_SIZE, "Video")


def validate_3d_model(file: UploadFile) -> None:
    """Validate 3D model file"""
    # Check by extension first (browsers often send wrong MIME type for 3D files)
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext in ALLOWED_3D_MODEL_EXTENSIONS:
        # Extension is valid, skip MIME check
        validate_file_size(file, MAX_3D_MODEL_SIZE, "3D model")
        return
    # Fall back to MIME type check
    validate_file_type(file, ALLOWED_3D_MODEL_TYPES, "3D model")
    validate_file_size(file, MAX_3D_MODEL_SIZE, "3D model")


def validate_document(file: UploadFile) -> None:
    """Validate document file"""
    validate_file_type(file, ALLOWED_DOCUMENT_TYPES, "document")
    validate_file_size(file, MAX_DOCUMENT_SIZE, "Document")
