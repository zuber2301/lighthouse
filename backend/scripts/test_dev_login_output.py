import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.users import User

async def simulate_dev_login():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as db:
        email = 'tenant_admin@triton.com'
        user_q = await db.execute(select(User).where(User.email == email))
        user = user_q.scalar_one_or_none()
        
        if not user:
            print("User not found")
            return

        user_data = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None
        }
        print(f"Role in DB object: {user.role}")
        print(f"Role in response: {user_data['role']}")
        
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(simulate_dev_login())
