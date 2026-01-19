import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.services.recognition_service import create_recognition
from app.models.badges import Badge

DATABASE_URL = settings.DATABASE_URL

async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # find acme tenant
        t = await session.execute(select(Tenant).where(Tenant.subdomain == 'acme'))
        tenant = t.scalar_one_or_none()
        if not tenant:
            print('Acme tenant not found')
            return
        tenant_id = tenant.id
        print('Acme tenant id:', tenant_id)

        # create two corporate users if missing
        users_to_create = [
            ('suresh@acme.com', 'Suresh Patel'),
            ('priya@acme.com', 'Priya Singh'),
        ]
        created_users = {}
        for email, name in users_to_create:
            r = await session.execute(select(User).where(User.email == email))
            u = r.scalar_one_or_none()
            if not u:
                u = User(
                    tenant_id=tenant_id,
                    email=email,
                    hashed_password=get_password_hash('password'),
                    full_name=name,
                    role=UserRole.CORPORATE_USER,
                    points_balance=500,
                    is_active=True,
                )
                session.add(u)
                await session.commit()
                await session.refresh(u)
                print('Created user', email, u.id)
            else:
                print('User exists', email, u.id)
            created_users[email] = u

        # choose a nominator (tenant admin)
        r = await session.execute(select(User).where(User.email == 'admin@acme.com'))
        nominator = r.scalar_one_or_none()
        if not nominator:
            print('Tenant admin admin@acme.com not found')
            return
        print('Nominator:', nominator.email, nominator.id)

        # pick a tenant-scoped badge if available
        r = await session.execute(select(Badge).where(Badge.tenant_id == tenant_id).limit(1))
        badge = r.scalar_one_or_none()
        badge_id = badge.id if badge else None
        print('Using badge id:', badge_id)

        # create recognitions for the two users
        for email, u in created_users.items():
            payload = type('P', (), {})()
            payload.nominee_id = u.id
            payload.points = 50
            payload.badge_id = badge_id
            payload.value_tag = None
            payload.message = f'Welcome recognition for {u.full_name}'
            payload.is_public = True

            try:
                rec = await create_recognition(db=session, tenant_id=tenant_id, nominator_id=nominator.id, payload=payload)
                await session.commit()
                await session.refresh(rec)
                print('Created recognition for', email, 'id=', rec.id)
            except Exception as exc:
                await session.rollback()
                print('Failed to create recognition for', email, exc)

if __name__ == '__main__':
    asyncio.run(run())
