import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.models.subscriptions import SubscriptionPlan
from app.core.security import get_password_hash
from app.core import tenancy


async def seed_test_personas():
    """Idempotently create subscription plans, a 'triton' tenant, and a small set of test personas.

    - Creates basic subscription plans if missing.
    - Creates the following users under the 'triton' tenant if they do not exist:
      - hr@triton.com (CORPORATE_USER)
      - eng-lead@triton.com (TENANT_LEAD)
      - dev@triton.com (CORPORATE_USER)

    Also ensures that the DEV_DEFAULT_TENANT exists if configured.
    """
    from app.core.config import settings
    async with AsyncSessionLocal() as session:
        # Ensure tenant exists (bypass tenant scoping)
        async with session.begin():
            # 0. Seed subscription plans
            plans = [
                {"name": "Basic", "monthly_price": 0, "features": {"max_users": 10, "max_recognitions": 100}},
                {"name": "Starter", "monthly_price": 2900, "features": {"max_users": 50, "max_recognitions": 1000}},
                {"name": "Professional", "monthly_price": 7900, "features": {"max_users": 200, "max_recognitions": 5000}},
                {"name": "Enterprise", "monthly_price": 19900, "features": {"max_users": 1000, "max_recognitions": -1}},
            ]
            for p in plans:
                res_p = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == p["name"]))
                if not res_p.scalar():
                    new_p = SubscriptionPlan(
                        name=p["name"],
                        monthly_price_in_paise=p["monthly_price"],
                        features=p["features"]
                    )
                    session.add(new_p)
                    print(f"Created subscription plan: {p['name']}")

            # 0b. Ensure platform admin user exists
            res_admin = await session.execute(select(User).where(User.email == settings.PLATFORM_ADMIN_EMAIL))
            if not res_admin.scalar():
                platform_admin = User(
                    email=settings.PLATFORM_ADMIN_EMAIL,
                    full_name="Platform Owner",
                    role=UserRole.PLATFORM_OWNER,
                    is_active=True
                )
                session.add(platform_admin)
                print(f"Created platform admin: {settings.PLATFORM_ADMIN_EMAIL}")

            # 1. Ensure 'triton' exists
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

            # 2. Ensure DEV_DEFAULT_TENANT exists if configured
            dev_tenant_id = getattr(settings, "DEV_DEFAULT_TENANT", None)
            if dev_tenant_id:
                res_dev = await session.execute(select(Tenant).where(Tenant.id == dev_tenant_id))
                if not res_dev.scalar():
                    dev_tenant = Tenant(
                        id=dev_tenant_id,
                        name="Default dev tenant",
                        subdomain="dev",
                        master_budget_balance=1000000,
                        status="active",
                    )
                    session.add(dev_tenant)
                    print(f"Created dev default tenant: {dev_tenant_id}")

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
