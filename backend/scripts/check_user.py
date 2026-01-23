import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.users import User

async def check():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        res = await s.execute(select(User).where(User.email == 'tenant_admin@triton.com'))
        u = res.scalar_one_or_none()
        print(f'User: {u.email}, Role: {u.role}, Tenant: {u.tenant_id}' if u else 'Not found')
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(check())
