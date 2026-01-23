import os
import sys
import asyncio
import pytest
import uuid
import sqlite3
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import pytest_asyncio

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

# Prefer in-memory SQLite for tests by default unless explicitly opting into Postgres.
# Set `USE_PG_FOR_TESTS=1` in the environment to use the external DATABASE_URL instead.
if not os.environ.get('USE_PG_FOR_TESTS'):
    os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:////tmp/test_lighthouse.db'

# Ensure sqlite can accept Python UUID objects by registering an adapter.
# This lets tests create models with uuid.UUID values when using SQLite.
try:
    sqlite3.register_adapter(uuid.UUID, lambda u: str(u))
except Exception:
    # If sqlite3 isn't available in the environment this is non-fatal for other DBs
    pass

# Ensure pytest-asyncio plugin is loaded so async fixtures/tests are awaited.
pytest_plugins = ("pytest_asyncio",)

from app.db.base import Base
from app.core import tenancy
from sqlalchemy import event
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.models.subscriptions import SubscriptionPlan
from app.models.budgets import BudgetPool
from app.core.config import settings
from httpx import AsyncClient
from app.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    # Use in-memory DB for fast tests; DATABASE_URL env var can override
    db_url = os.environ.get('DATABASE_URL', 'sqlite+aiosqlite:///:memory:')
    engine = create_async_engine(db_url, echo=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def create_tables(test_engine):
    """Create all database tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed subscription plans for tests
    from app.models.subscriptions import SubscriptionPlan
    async_session = sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        plans = [
            SubscriptionPlan(name="Basic", monthly_price_in_paise=0, features=["basic"]),
            SubscriptionPlan(name="Pro", monthly_price_in_paise=2999, features=["pro"]),
        ]
        for plan in plans:
            session.add(plan)
        await session.commit()


@pytest_asyncio.fixture
async def db_session(test_engine, create_tables):
    """Create a test database session."""
    async_session = sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Set up tenant scoping for tests
        @event.listens_for(session.sync_session, "do_orm_execute")
        def _add_tenant_criteria(execute_state):
            if not execute_state.is_select:
                return
            if getattr(tenancy, "is_bypass_enabled", None) and tenancy.is_bypass_enabled():
                return
            tenant = tenancy.CURRENT_TENANT.get(None)
            if tenant is None:
                return
            print(f"DEBUG DB Filter: {tenant} (type: {type(tenant)})")
            exec_opts = getattr(execute_state, "execution_options", {}) or {}
            if exec_opts.get("ignore_tenant"):
                return
            from app.db.base import TenantMixin
            from sqlalchemy.orm import with_loader_criteria
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(TenantMixin, lambda cls: cls.tenant_id == tenant, include_aliases=True)
            )

        yield session


@pytest_asyncio.fixture
async def platform_admin_user(db_session):
    """Create a platform admin user for testing."""
    user = User(
        email=f"platform_admin_{uuid.uuid4().hex}@test.com",
        full_name="Platform Owner",
        role=UserRole.PLATFORM_OWNER,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_tenant(db_session):
    """Create a test tenant."""
    tenant = Tenant(
        name="Test Company",
        subdomain=f"testcompany_{uuid.uuid4().hex}",
        status="active",
        master_budget_balance=10000
    )
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest_asyncio.fixture
async def tenant_admin_user(db_session, test_tenant):
    """Create a tenant admin user."""
    user = User(
        email=f"tenant_admin_{uuid.uuid4().hex}@testcompany.com",
        full_name="Tenant Admin",
        role=UserRole.TENANT_ADMIN,
        tenant_id=test_tenant.id,
        department="Engineering",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
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


@pytest_asyncio.fixture
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
@pytest_asyncio.fixture
async def corporate_user(db_session, test_tenant):
    """Create a corporate user for testing."""
    user = User(
        email=f"corp_user_{uuid.uuid4().hex}@test.com",
        full_name="Corporate User",
        role=UserRole.CORPORATE_USER,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
