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
        print('acme tenant ->', tenant.id if tenant else 'NOT FOUND')
        emails = ['admin@acme.com','suresh@acme.com','priya@acme.com']
        for e in emails:
            res = await session.execute(select(User).where(User.email==e))
            u = res.scalar_one_or_none()
            if u:
                print(f"{e} -> {u.id} (tenant: {repr(u.tenant_id)})")
            else:
                print(f"{e} -> NOT FOUND")

if __name__ == '__main__':
    asyncio.run(run())
