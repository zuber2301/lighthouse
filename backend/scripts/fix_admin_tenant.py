import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.users import User
from app.models.tenants import Tenant
from sqlalchemy import select

async def run():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        t = await session.execute(select(Tenant).where(Tenant.subdomain=='acme'))
        tenant = t.scalar_one_or_none()
        if not tenant:
            print('Tenant not found')
            return
        res = await session.execute(select(User).where(User.email=='admin@acme.com'))
        u = res.scalar_one_or_none()
        if not u:
            print('User not found')
            return
        print('Before:', u.id, u.tenant_id)
        u.tenant_id = tenant.id
        session.add(u)
        await session.commit()
        print('Updated tenant for user', u.id)

if __name__ == '__main__':
    asyncio.run(run())
