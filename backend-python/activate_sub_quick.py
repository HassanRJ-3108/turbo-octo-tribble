"""
Quick fix script to activate subscription manually
Run: python activate_sub_quick.py
"""
import asyncio
import sys
from app.db.session import get_db
from app.models.subscription import Subscription
from sqlalchemy import select
from datetime import datetime

async def activate_subscription():
    print("🔧 Starting subscription activation...")
    
    restaurant_id = "d88157b0-18e0-4cd9-95b8-77019a60065f"
    lemon_sub_id = "1883724"
    
    async for session in get_db():
        # Find subscription
        result = await session.execute(
            select(Subscription).where(Subscription.restaurant_id == restaurant_id)
        )
        sub = result.scalar_one_or_none()
        
        if sub:
            print(f"✅ Found subscription: {sub.id}, current status: {sub.status}")
            sub.status = "active"
            sub.lemon_subscription_id = lemon_sub_id
            sub.last_billed_at = datetime.utcnow()
            sub.updated_at = datetime.utcnow()
            print(f"✅ ACTIVATED! Subscription {sub.id} is now 'active'")
            # Note: get_db() auto-commits on success
        else:
            print(f"🆕 Creating new subscription...")
            sub = Subscription(
                restaurant_id=restaurant_id,
                status="active",
                lemon_subscription_id=lemon_sub_id,
                active_products_count=0,
                next_bill_amount=0,
                last_billed_at=datetime.utcnow()
            )
            session.add(sub)
            print(f"✅ CREATED AND ACTIVATED! Subscription will have ID after commit")
        
        return True

if __name__ == "__main__":
    try:
        asyncio.run(activate_subscription())
        print("\n✅ SUCCESS! Refresh your dashboard - subscription should now be active!")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
