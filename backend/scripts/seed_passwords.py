#!/usr/bin/env python3
"""Update existing users with a hashed default password when missing.

Usage: run inside the backend container where app settings and DB are available.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.users import User


DATABASE_URL = settings.DATABASE_URL


async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # find users without a hashed password
        q = await session.execute(select(User).where((User.hashed_password == None) | (User.hashed_password == "")))
        users = q.scalars().all()
        if not users:
            print("No users without hashed_password found.")
            return

        default_pw = "password"
        for u in users:
            u.hashed_password = get_password_hash(default_pw)
            session.add(u)
            print(f"Updated user: {u.email}")

        await session.commit()
        print(f"Updated {len(users)} users with default password.")


if __name__ == '__main__':
    asyncio.run(main())
