"""
Create Admin User Script

Creates an admin user in the database.
Run this script to create initial admin users.
"""

import asyncio
import sys
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User


async def create_admin(clerk_user_id: str, email: str, full_name: str):
    """
    Create admin user.

    Args:
        clerk_user_id: Clerk user ID from Clerk dashboard
        email: Admin email address
        full_name: Admin full name
    """
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.clerk_user_id == clerk_user_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"User {clerk_user_id} already exists")
            if existing.role != "admin":
                existing.role = "admin"
                await db.commit()
                print(f"Updated {email} to admin role")
            return

        # Create new admin user
        user = User(
            clerk_user_id=clerk_user_id,
            email=email,
            full_name=full_name,
            role="admin",
        )
        db.add(user)
        await db.commit()
        print(f"Created admin user: {email}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <clerk_user_id> <email> <full_name>")
        print(
            "Example: python create_admin.py user_2abc123 admin@foodar.pk 'Admin User'"
        )
        sys.exit(1)

    clerk_user_id = sys.argv[1]
    email = sys.argv[2]
    full_name = sys.argv[3]

    asyncio.run(create_admin(clerk_user_id, email, full_name))
