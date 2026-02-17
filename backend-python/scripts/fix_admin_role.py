import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def fix_admin_role():
    async with AsyncSessionLocal() as db:
        # Find users with role 'admim' (typo)
        result = await db.execute(
            select(User).where(User.role == "admim")
        )
        users = result.scalars().all()
        
        for user in users:
            print(f"Found user with typo role: {user.email}")
            user.role = "admin"
            print(f"Fixed role for {user.email}")
            
        await db.commit()
        print("Done fixing roles.")

if __name__ == "__main__":
    asyncio.run(fix_admin_role())
