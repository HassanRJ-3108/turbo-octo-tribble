"""
Clerk Service

Handles interactions with Clerk API for user management.
"""

import httpx
from app.config import settings

SAFE_TO_DELETE_DOMAINS = ["example.com", "test.com"]  # Safeguard if needed

async def delete_clerk_user(user_id: str) -> bool:
    """
    Delete a user from Clerk.

    Args:
        user_id: The Clerk User ID (e.g., user_2abc...)

    Returns:
        bool: True if deleted successfully, False otherwise.
    """
    if not settings.CLERK_SECRET_KEY:
        print("❌ Clerk Secret Key not set")
        return False

    url = f"https://api.clerk.com/v1/users/{user_id}"
    headers = {
        "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"🗑️ Deleting Clerk user: {user_id}")
            response = await client.delete(url, headers=headers)
            
            if response.status_code == 200:
                print(f"✅ User {user_id} deleted from Clerk")
                return True
            elif response.status_code == 404:
                print(f"⚠️ User {user_id} not found in Clerk (already deleted?)")
                return True
            else:
                print(f"❌ Failed to delete Clerk user {user_id}: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error deleting Clerk user: {e}")
            return False
