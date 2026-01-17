import asyncio
import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.db.base import Base
from app.core import tenancy
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.models.subscriptions import SubscriptionPlan
from app.models.budgets import BudgetPool
from app.core.config import settings
import sys
import types

# Mock external dependencies for testing
jose_stub = types.SimpleNamespace(
    jwt=types.SimpleNamespace(decode=lambda *a, **k: {"sub": "test@example.com"}),
    JWTError=Exception
)
sys.modules.setdefault("jose", jose_stub)

fake_settings = types.SimpleNamespace(
    DEV_DEFAULT_TENANT=None,
    JWT_SECRET="test_secret_key_for_testing_only",
    JWT_ALGORITHM="HS256",
    DATABASE_URL="sqlite+aiosqlite:///:memory:"
)
sys.modules.setdefault("app.core.config", types.SimpleNamespace(settings=fake_settings))


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
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
    async_session = sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

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
        description="Basic plan for testing",
        monthly_price=0,
        annual_price=0,
        max_users=50,
        features=["recognition", "rewards"]
    )
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


@pytest.fixture
async def budget_pool(db_session, test_tenant):
    """Create a test budget pool."""
    pool = BudgetPool(
        tenant_id=test_tenant.id,
        name="Test Budget",
        allocated_points=5000,
        remaining_points=5000,
        is_active=True
    )
    db_session.add(pool)
    await db_session.commit()
    await db_session.refresh(pool)
    return pool