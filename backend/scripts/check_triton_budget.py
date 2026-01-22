import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.tenants import Tenant

async def check_budget():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as db:
        res = await db.execute(select(Tenant).where(Tenant.subdomain == 'triton'))
        t = res.scalar_one_or_none()
        print(f"Tenant: {t.name}, Budget: {t.master_budget_balance}")
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(check_budget())
