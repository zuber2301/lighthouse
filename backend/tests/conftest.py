import os
import sys
import asyncio
import pytest
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Ensure backend package is importable when tests run from repo root
HERE = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(HERE, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Provide sensible defaults for settings used during tests
os.environ.setdefault('DEV_DEFAULT_TENANT', 'dev-tenant')
os.environ.setdefault('JWT_SECRET', 'test_secret_key_for_testing_only')
os.environ.setdefault('JWT_ALGORITHM', 'HS256')
os.environ.setdefault('DATABASE_URL', 'sqlite+aiosqlite:///:memory:')

from app.db.base import Base
from app.core import tenancy
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.models.subscriptions import SubscriptionPlan
from app.models.budgets import BudgetPool
from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    # Use in-memory DB for fast tests; DATABASE_URL env var can override
    db_url = os.environ.get('DATABASE_URL', 'sqlite+aiosqlite:///:memory:')
    engine = create_async_engine(db_url, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
async def create_tables(test_engine):
    """Create all database tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@pytest.fixture
async def db_session(test_engine, create_tables):
    """Create a test database session."""
    async_session = sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Set up tenant scoping for tests
        @tenancy.event.listens_for(session.sync_session, "do_orm_execute")
        def _add_tenant_criteria(execute_state):
            if not execute_state.is_select:
                return
            if getattr(tenancy, "is_bypass_enabled", None) and tenancy.is_bypass_enabled():
                return
            tenant = tenancy.CURRENT_TENANT.get(None)
            if tenant is None:
                return
            exec_opts = getattr(execute_state, "execution_options", {}) or {}
            if exec_opts.get("ignore_tenant"):
                return
            from app.db.base import TenantMixin
            from sqlalchemy.orm import with_loader_criteria
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(TenantMixin, lambda cls: cls.tenant_id == tenant, include_aliases=True)
            )

        yield session


@pytest.fixture
async def platform_admin_user(db_session):
    """Create a platform admin user for testing."""
    user = User(
        email="platform_admin@test.com",
        full_name="Platform Admin",
        role=UserRole.PLATFORM_ADMIN,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_tenant(db_session):
    """Create a test tenant."""
    tenant = Tenant(
        name="Test Company",
        subdomain="testcompany",
        status="active",
        master_budget_balance=10000
    )
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest.fixture
async def tenant_admin_user(db_session, test_tenant):
    """Create a tenant admin user."""
    user = User(
        email="tenant_admin@testcompany.com",
        full_name="Tenant Admin",
        role=UserRole.TENANT_ADMIN,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def subscription_plan(db_session):
    """Create a test subscription plan."""
    plan = SubscriptionPlan(
        name="Basic",
        monthly_price_in_paise=0,
        features={"description": "Basic plan for testing", "max_users": 50}
    )
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


@pytest.fixture
async def budget_pool(db_session, test_tenant, platform_admin_user):
    """Create a test budget pool using current BudgetPool model fields."""
    pool = BudgetPool(
        tenant_id=test_tenant.id,
        period="initial",
        total_amount=5000.00,
        created_by=platform_admin_user.id
    )
    db_session.add(pool)
    await db_session.commit()
    await db_session.refresh(pool)
    return pool