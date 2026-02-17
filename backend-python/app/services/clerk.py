"""
Clerk Service Integration

Provides Clerk SDK initialization and utilities for user management.
"""

from clerk_backend_api import Clerk
from app.config import settings

# Initialize Clerk SDK
clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)


def get_clerk_user(user_id: str) -> dict:
    """
    Fetch user details from Clerk.

    Args:
        user_id: Clerk user ID

    Returns:
        dict: User information from Clerk
    """
    try:
        user = clerk_client.users.get(user_id)
        return user
    except Exception as e:
        print(f"Failed to fetch user from Clerk: {e}")
        raise


def update_clerk_user_metadata(user_id: str, metadata: dict) -> dict:
    """
    Update user public metadata in Clerk.

    Args:
        user_id: Clerk user ID
        metadata: Dictionary of metadata to update

    Returns:
        dict: Updated user information
    """
    try:
        user = clerk_client.users.update(
            user_id=user_id, public_metadata=metadata
        )
        return user
    except Exception as e:
        print(f"Failed to update user metadata: {e}")
        raise
