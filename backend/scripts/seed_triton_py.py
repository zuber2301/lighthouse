#!/usr/bin/env python3
"""Seed Triton tenant and users using SQLAlchemy models (works with configured DATABASE_URL)."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.db.base import Base
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.core.security import get_password_hash


ess = None

async def seed():
    db_url = settings.DATABASE_URL
    # If a sync postgresql URL is provided, convert it to an asyncpg URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        tenant_id = '748c0823-c976-49a6-8968-3e4210a48b96'
        # Create tenant if missing
        t_q = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = t_q.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(id=tenant_id, name='Triton Industries', subdomain='triton', master_budget_balance=1000000)
            session.add(tenant)
            await session.commit()
            await session.refresh(tenant)
            print('Created tenant Triton:', tenant.id)
        else:
            print('Tenant already exists:', tenant.id)

        # Helper to create user if missing
        async def ensure_user(email, full_name, role, tenant_id_value=None, hashed_pw=None, lead_budget_balance=None, points_balance=None):
            q = await session.execute(select(User).where(User.email == email))
            u = q.scalar_one_or_none()
            if u:
                print('User exists:', email)
                return u
            u = User(
                email=email,
                full_name=full_name,
                role=role,
                is_active=True,
                tenant_id=tenant_id_value
            )
            if hashed_pw:
                u.hashed_password = get_password_hash(hashed_pw)
            if lead_budget_balance is not None:
                u.lead_budget_balance = lead_budget_balance
            if points_balance is not None:
                u.points_balance = points_balance
            session.add(u)
            await session.commit()
            await session.refresh(u)
            print('Created user:', email)
            return u

        # Platform admin (global scope)
        await ensure_user('super@lighthouse.com', 'Global SuperAdmin', UserRole.PLATFORM_OWNER, tenant_id_value=None)

        # Tenant admin
        await ensure_user('hr@triton.com', 'Sarah - HR Manager', UserRole.TENANT_ADMIN, tenant_id_value=tenant_id)

        # Tenant lead
        await ensure_user('eng-lead@triton.com', 'David - Eng Director', UserRole.TENANT_LEAD, tenant_id_value=tenant_id, lead_budget_balance=0)

        # Corporate user
        await ensure_user('dev@triton.com', 'Alex - Software Engineer', UserRole.CORPORATE_USER, tenant_id_value=tenant_id, points_balance=0)

    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(seed())
