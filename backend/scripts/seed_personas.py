#!/usr/bin/env python3
"""Seed specific users for persona testing."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.db.base import Base
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.core.security import get_password_hash

async def seed():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Ensure Triton tenant exists
        tenant_id = '748c0823-c976-49a6-8968-3e4210a48b96'
        t_q = await session.execute(select(Tenant).where(Tenant.subdomain == 'triton'))
        tenant = t_q.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(id=tenant_id, name='Triton Industries', subdomain='triton', master_budget_balance=1000000)
            session.add(tenant)
            await session.commit()
            print('Created tenant Triton')
        else:
            tenant_id = tenant.id
            print(f'Tenant Triton already exists with id {tenant_id}')

        # Helper to create/update user
        async def upsert_user(email, full_name, role, tenant_id_val=None):
            q = await session.execute(select(User).where(User.email == email))
            u = q.scalar_one_or_none()
            
            hashed_pw = get_password_hash("password123")
            
            if u:
                print(f'Updating user: {email}')
                u.full_name = full_name
                u.role = role
                u.tenant_id = tenant_id_val
                u.hashed_password = hashed_pw
            else:
                print(f'Creating user: {email}')
                u = User(
                    email=email,
                    full_name=full_name,
                    role=role,
                    is_active=True,
                    tenant_id=tenant_id_val,
                    hashed_password=hashed_pw
                )
                session.add(u)
            
            await session.commit()
            return u

        # 1. Platform Owner
        await upsert_user('super_user@lighthouse.com', 'Super User', UserRole.PLATFORM_OWNER)

        # 2. Tenant Admin
        await upsert_user('tenant_admin@triton.com', 'Triton Admin', UserRole.TENANT_ADMIN, tenant_id_val=tenant_id)

        # 3. Tenant Lead
        await upsert_user('eng-lead@triton.com', 'Engineering Lead', UserRole.TENANT_LEAD, tenant_id_val=tenant_id)

        # 4. Corporate User
        await upsert_user('user@triton.com', 'Triton User', UserRole.CORPORATE_USER, tenant_id_val=tenant_id)

    print("\nPersona accounts seeded successfully!")
    print("Default password for all accounts: password123")
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(seed())
