import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.core.security import get_password_hash
from app.core import tenancy


async def seed_test_personas():
    """Idempotently create a 'triton' tenant and a small set of test personas.

    Creates the following users under the 'triton' tenant if they do not exist:
      - hr@triton.com (CORPORATE_USER)
      - eng-lead@triton.com (TENANT_LEAD)
      - dev@triton.com (CORPORATE_USER)

    This function is safe to call repeatedly and is intended for development startup.
    """
    async with AsyncSessionLocal() as session:
        # Ensure tenant exists (bypass tenant scoping)
        async with session.begin():
            result = await session.execute(select(Tenant).where(Tenant.subdomain == "triton"))
            tenant = result.scalar()
            if not tenant:
                tenant = Tenant(
                    name="Triton",
                    subdomain="triton",
                    master_budget_balance=1000000,
                    status="active",
                )
                session.add(tenant)
                await session.flush()
                await session.refresh(tenant)
                print(f"Created tenant: triton id={tenant.id}")
            else:
                print(f"Tenant exists: triton id={tenant.id}")

        # Create users if missing. Use bypass context to avoid tenant scoping interference.
        pwd = get_password_hash("Password123")
        users = [
            {"email": "hr@triton.com", "role": UserRole.CORPORATE_USER, "full_name": "HR User"},
            {"email": "eng-lead@triton.com", "role": UserRole.TENANT_LEAD, "full_name": "Engineering Lead"},
            {"email": "dev@triton.com", "role": UserRole.CORPORATE_USER, "full_name": "Dev Persona"},
        ]

        with tenancy.bypass_tenant_context():
            async with session.begin():
                for u in users:
                    result = await session.execute(select(User).where(User.email == u["email"]))
                    existing = result.scalar()
                    if existing:
                        print(f"User exists: {u['email']}")
                        continue

                    new_user = User(
                        tenant_id=tenant.id,
                        email=u["email"],
                        hashed_password=pwd,
                        full_name=u.get("full_name"),
                        role=u["role"],
                        is_active=True,
                    )
                    session.add(new_user)
                    print(f"Created user: {u['email']}")

        # commit completed creations
        await session.commit()


def run():
    asyncio.run(seed_test_personas())


if __name__ == "__main__":
    run()
