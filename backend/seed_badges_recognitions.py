#!/usr/bin/env python3
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.db.base import Base
from app.models import Tenant, User, Badge, Recognition
from app.core.security import get_password_hash


DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with AsyncSessionLocal() as session:
        # ensure tables exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # find test tenant
        res = await session.execute(select(Tenant).where(Tenant.subdomain == 'acme'))
        tenant = res.scalar_one_or_none()
        if not tenant:
            print('Test tenant not found; run seed_data.py first')
            return

        # Create global badge if missing
        res = await session.execute(select(Badge).where(Badge.name == 'Team Player', Badge.tenant_id == None))
        b_global = res.scalar_one_or_none()
        if not b_global:
            b_global = Badge(
                tenant_id=None,
                name='Team Player',
                icon_url=None,
                points_value=50,
                category='Value-based'
            )
            session.add(b_global)
            await session.flush()
            print('Created global badge Team Player')

        # Create tenant-specific badge
        res = await session.execute(select(Badge).where(Badge.name == 'Acme MVP', Badge.tenant_id == tenant.id))
        b_tenant = res.scalar_one_or_none()
        if not b_tenant:
            b_tenant = Badge(
                tenant_id=tenant.id,
                name='Acme MVP',
                icon_url=None,
                points_value=100,
                category='Milestone'
            )
            session.add(b_tenant)
            await session.flush()
            print('Created tenant badge Acme MVP')

        # find two corporate users to create recognitions between
        res = await session.execute(select(User).where(User.tenant_id == tenant.id).limit(2))
        users = res.scalars().all()
        if len(users) < 2:
            print('Not enough users in tenant to create recognitions')
        else:
            u1, u2 = users[0], users[1]
            # create two recognitions
            r1 = Recognition(
                tenant_id=tenant.id,
                nominator_id=u1.id,
                nominee_id=u2.id,
                badge_id=b_tenant.id,
                message='Great collaboration on the Q1 project!',
                points_awarded=b_tenant.points_value,
                is_public=True,
                points=b_tenant.points_value,
                status='APPROVED'
            )
            session.add(r1)

            r2 = Recognition(
                tenant_id=tenant.id,
                nominator_id=u2.id,
                nominee_id=u1.id,
                badge_id=b_global.id,
                message='Thanks for helping with onboarding',
                points_awarded=b_global.points_value,
                is_public=True,
                points=b_global.points_value,
                status='APPROVED'
            )
            session.add(r2)
            print('Created sample recognitions')

        await session.commit()


if __name__ == '__main__':
    asyncio.run(seed())
