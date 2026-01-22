import asyncio
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.main import app
from app.core.auth import create_access_token
from app.models.users import User, UserRole
from app.models.badges import Badge


async def make_session():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest.mark.asyncio
async def test_create_recognition_success():
    # create a DB session directly
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db_session:
        # create or reuse a tenant and tenant admin
        from app.models.tenants import Tenant
        res = await db_session.execute(select(Tenant).where(Tenant.subdomain == 'integration'))
        tenant = res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name='IntegrationTenant', subdomain='integration', status='active')
            db_session.add(tenant)
            await db_session.commit()
            await db_session.refresh(tenant)

        res = await db_session.execute(select(User).where(User.email.like('tenant_admin_integ%')))
        admins = res.scalars().all()
        admin = admins[0] if admins else None
        if not admin:
            admin = User(
                email=f"tenant_admin_integ_{uuid.uuid4().hex[:8]}@example.com",
                full_name="Tenant Admin",
                role=UserRole.TENANT_ADMIN,
                tenant_id=tenant.id,
                is_active=True,
            )
            db_session.add(admin)
            await db_session.commit()
            await db_session.refresh(admin)

        tenant_id = tenant.id

        # create nominee
        nominee = User(
            email=f"suresh_test_{uuid.uuid4().hex[:8]}@example.com",
            full_name="Suresh Test",
            role=UserRole.CORPORATE_USER,
            tenant_id=tenant_id,
            is_active=True,
        )
        db_session.add(nominee)
        await db_session.commit()
        await db_session.refresh(nominee)

        # create a badge for the tenant
        badge = Badge(tenant_id=tenant_id, name=f"Test Badge {uuid.uuid4().hex[:8]}", points_value=10)
        db_session.add(badge)
        await db_session.commit()
        await db_session.refresh(badge)

    token = create_access_token({"sub": admin.id, "tenant_id": tenant_id, "role": "TENANT_ADMIN"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        payload = {
            'nominee_id': nominee.id,
            'points': 25,
            'badge_id': badge.id,
            'message': 'Great work',
            'is_public': True
        }
        r = await client.post('/recognition/', json=payload, headers=headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body['nominee_id'] == nominee.id
        assert body['points'] == 25


@pytest.mark.asyncio
async def test_nominee_not_found_returns_400():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db_session:
        from app.models.tenants import Tenant
        res = await db_session.execute(select(Tenant).where(Tenant.subdomain == 'integration2'))
        tenant = res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name='IntegrationTenant2', subdomain='integration2', status='active')
            db_session.add(tenant)
            await db_session.commit()
            await db_session.refresh(tenant)

        res = await db_session.execute(select(User).where(User.email == 'tenant_admin_integ2_2G6tnX4L@example.com'))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                email="tenant_admin_integ2_2G6tnX4L@example.com",
                full_name="Tenant Admin 2",
                role=UserRole.TENANT_ADMIN,
                tenant_id=tenant.id,
                is_active=True,
            )
            db_session.add(admin)
            await db_session.commit()
            await db_session.refresh(admin)

        tenant_id = tenant.id

    token = create_access_token({"sub": admin.id, "tenant_id": tenant_id, "role": "TENANT_ADMIN"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        payload = {
            'nominee_id': '00000000-0000-0000-0000-000000000000',
            'points': 10,
            'badge_id': None,
            'message': 'No such user',
            'is_public': True
        }
        r = await client.post('/recognition/', json=payload, headers=headers)
        assert r.status_code == 400


@pytest.mark.asyncio
async def test_tenant_mismatch_forbidden():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db_session:
        from app.models.tenants import Tenant
        res = await db_session.execute(select(Tenant).where(Tenant.subdomain == 'integration3'))
        tenant = res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name='IntegrationTenant3', subdomain='integration3', status='active')
            db_session.add(tenant)
            await db_session.commit()
            await db_session.refresh(tenant)

        res = await db_session.execute(select(User).where(User.email == 'tenant_admin_integ3_XJzSDtUk@example.com'))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                email="tenant_admin_integ3_XJzSDtUk@example.com",
                full_name="Tenant Admin 3",
                role=UserRole.TENANT_ADMIN,
                tenant_id=tenant.id,
                is_active=True,
            )
            db_session.add(admin)
            await db_session.commit()
            await db_session.refresh(admin)

        tenant_id = tenant.id

    fake_tenant = '00000000-0000-0000-0000-000000000000'
    token = create_access_token({"sub": admin.id, "tenant_id": fake_tenant, "role": "TENANT_ADMIN"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        payload = {
            'nominee_id': admin.id,
            'points': 10,
            'badge_id': None,
            'message': 'Tenant mismatch test',
            'is_public': True
        }
        r = await client.post('/recognition/', json=payload, headers=headers)
        # With a fake tenant in the token the server should reject because nominee lookup fails
        assert r.status_code == 400
