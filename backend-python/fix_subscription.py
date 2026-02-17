"""
Quick script to manually activate subscription for restaurant d88157b0-18e0-4cd9-95b8-77019a60065f
Run with: python fix_subscription.py
"""
import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql+asyncpg://postgres.nbljljyilnpqukpnbcmi:xcTlic9Lks136sMF@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

async def fix_subscription():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        restaurant_id = "d88157b0-18e0-4cd9-95b8-77019a60065f"
        lemon_subscription_id = "1883724"
        
        # Check if subscription exists
        result = await session.execute(
            select("subscriptions").where(f"restaurant_id = '{restaurant_id}'")
        )
        subscription = result.first()
        
        if subscription:
            print(f"✅ Found existing subscription: {subscription}")
            # Update it
            await session.execute(
                update("subscriptions")
                .where(f"restaurant_id = '{restaurant_id}'")
                .values(
                    status="active",
                    lemon_subscription_id=lemon_subscription_id,
                    last_billed_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
            )
            print("✅ Updated subscription to 'active'")
        else:
            print("❌ No subscription found - will be created by fixed webhook")
        
        await session.commit()
        print("✅ Changes committed!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_subscription())
