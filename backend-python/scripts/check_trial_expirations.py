"""
Check Trial Expirations Script

Background job to check for trial expirations and send reminder emails.
Should be run daily (e.g., via cron or scheduler).
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.restaurant import Restaurant
from app.models.user import User
from app.core.emails import send_trial_expiration_reminder


async def check_trial_expirations():
    """
    Check for trials expiring in 24 hours and send reminder emails.
    """
    async with AsyncSessionLocal() as db:
        # Find restaurants with trials expiring in 24 hours
        tomorrow = datetime.utcnow() + timedelta(days=1)
        tomorrow_end = tomorrow + timedelta(hours=1)

        result = await db.execute(
            select(Restaurant)
            .where(Restaurant.status == "approved")
            .where(Restaurant.trial_ends_at >= tomorrow)
            .where(Restaurant.trial_ends_at <= tomorrow_end)
        )
        expiring_restaurants = result.scalars().all()

        print(f"Found {len(expiring_restaurants)} trials expiring in 24 hours")

        for restaurant in expiring_restaurants:
            # Get owner
            result = await db.execute(
                select(User).where(User.id == restaurant.owner_id)
            )
            owner = result.scalar_one_or_none()

            if owner:
                try:
                    await send_trial_expiration_reminder(
                        owner.email, restaurant.name, 1
                    )
                    print(
                        f"Sent reminder to {owner.email} for {restaurant.name}"
                    )
                except Exception as e:
                    print(f"Failed to send email: {e}")


if __name__ == "__main__":
    asyncio.run(check_trial_expirations())
