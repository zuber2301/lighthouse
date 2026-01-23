#!/usr/bin/env python3
import asyncio
import sys
from app.core.config import settings
from app.models.users import User, UserRole
from app.db.base import Base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


async def main(email: str, role: str = 'CORPORATE_USER'):
    db_url = settings.DATABASE_URL
    engine = create_async_engine(db_url, echo=False)
    # Ensure tables exist (use metadata from app.db.base)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Check existing
        res = await session.execute("SELECT id, email FROM users WHERE email = :email", {'email': email})
        row = res.first()
        if row:
            print('User already exists:', row[1])
            return

        # Create user
        user = User(email=email, full_name=email.split('@')[0], role=UserRole[role], is_active=True)
        # Attach DEV_DEFAULT_TENANT if available
        if getattr(settings, 'DEV_DEFAULT_TENANT', None):
            user.tenant_id = settings.DEV_DEFAULT_TENANT

        session.add(user)
        await session.commit()
        await session.refresh(user)
        print('Created user:', user.email, 'id=', user.id)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('usage: create_dev_user.py email [role]')
        sys.exit(2)
    email = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else 'CORPORATE_USER'
    asyncio.run(main(email, role))
