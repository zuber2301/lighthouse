#!/usr/bin/env python3
"""Seed 105-account bootstrap using SQLAlchemy (idempotent).

Creates:
- Platform owner (settings.PLATFORM_ADMIN_EMAIL)
- Tenants: Triton Industries, UniMind Tech
- 2 Tenant Admins per tenant
- 2 Leads per department (5 departments)
- ~8 Corporate users per department (stopping at ~50 users per tenant)

Run with: python backend/scripts/seed_105_accounts.py
"""
import asyncio
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.db.base import Base
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.core.security import get_password_hash

DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Product']
JOB_TITLES = {
    'Engineering': ['Software Engineer', 'DevOps Specialist', 'Frontend Dev', 'QA Engineer'],
    'Marketing': ['Content Strategist', 'SEO Specialist', 'Growth Lead', 'Brand Manager'],
    'Sales': ['Account Executive', 'SDR', 'Sales Manager', 'Partnerships'],
    'Human Resources': ['People Partner', 'Talent Scout', 'HR Generalist'],
    'Product': ['Product Manager', 'UX Designer', 'Data Analyst']
}

PASSWORD = 'password'


def new_uuid():
    return str(uuid.uuid4())


async def ensure_tenant(session: AsyncSession, name: str, subdomain: str, budget: int) -> Tenant:
    q = await session.execute(select(Tenant).where(Tenant.subdomain == subdomain))
    t = q.scalar_one_or_none()
    if t:
        print(f"ℹ️ Tenant already exists: {name} (id={t.id})")
        return t
    t = Tenant(id=new_uuid(), name=name, subdomain=subdomain, master_budget_balance=budget)
    session.add(t)
    await session.commit()
    await session.refresh(t)
    print(f"✅ Created Tenant: {name} (id={t.id})")
    return t


async def ensure_user(session: AsyncSession, email: str, full_name: str, role: UserRole, tenant_id: str | None = None, department: str | None = None, job_title: str | None = None, points_balance: int | None = None, lead_budget_balance: int | None = None, hashed_pw: str | None = None, is_active: bool = True) -> User:
    q = await session.execute(select(User).where(User.email == email))
    u = q.scalar_one_or_none()
    if u:
        print(f"ℹ️ User exists: {email}")
        return u
    u = User(
        id=new_uuid(),
        email=email,
        full_name=full_name,
        role=role,
        tenant_id=tenant_id,
        department=department,
        job_title=job_title,
        is_active=is_active
    )
    if hashed_pw:
        u.hashed_password = get_password_hash(hashed_pw)
    if points_balance is not None:
        u.points_balance = points_balance
    if lead_budget_balance is not None:
        u.lead_budget_balance = lead_budget_balance
    session.add(u)
    await session.commit()
    await session.refresh(u)
    print(f"✅ Created user: {email}")
    return u


async def seed():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Platform owner
        admin_email = settings.PLATFORM_ADMIN_EMAIL or 'super_user@lighthouse.com'
        if not (await session.execute(select(User).where(User.email == admin_email))).scalar_one_or_none():
            await ensure_user(session, admin_email, 'Super User', UserRole.PLATFORM_OWNER, tenant_id=None, hashed_pw=PASSWORD, is_active=True)
        else:
            print(f"ℹ️ Platform Owner already exists: {admin_email}")

        tenants = [
            {"name": "Triton Industries", "subdomain": "triton", "budget": 1000000},
            {"name": "UniMind Tech", "subdomain": "unimind", "budget": 500000}
        ]

        for t in tenants:
            tenant = await ensure_tenant(session, t['name'], t['subdomain'], t['budget'])

            # Tenant admins (2)
            for i in range(1, 3):
                await ensure_user(session, f"admin{i}@{tenant.subdomain}.com", f"{t['name']} Admin {i}", UserRole.TENANT_ADMIN, tenant_id=tenant.id, hashed_pw=PASSWORD, job_title='HR Director')

            # Leads and Users
            user_count = 0
            # 2 leads per dept
            for d_name in DEPARTMENTS:
                lead_ids = []
                for l in range(1, 3):
                    lead = await ensure_user(session, f"lead.{d_name.lower()}{l}@{tenant.subdomain}.com", f"{d_name} Lead {l}", UserRole.TENANT_LEAD, tenant_id=tenant.id, department=d_name, job_title=f"Head of {d_name}", points_balance=5000, lead_budget_balance=0, hashed_pw=PASSWORD)
                    lead_ids.append(lead.id)
                    user_count += 1

                # Corporate users per dept (approx 8, enforce cap ~50 total)
                for u in range(1, 9):
                    if user_count >= 50:
                        break
                    email = f"user{user_count + 1}@{tenant.subdomain}.com"
                    await ensure_user(session, email, f"{d_name} Pro {u}", UserRole.CORPORATE_USER, tenant_id=tenant.id, department=d_name, job_title=random.choice(JOB_TITLES[d_name]), points_balance=random.randint(0, 2500), lead_budget_balance=0, hashed_pw=PASSWORD)
                    user_count += 1

            print(f"✅ Seeded {t['name']} with {user_count} users.")

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(seed())
