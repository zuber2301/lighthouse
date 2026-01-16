from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria
from app.core.config import settings
from app.core import tenancy
from app.db.base import TenantMixin


engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


@event.listens_for(Session, "do_orm_execute")
def _add_tenant_criteria(execute_state):
    """Apply tenant scoping automatically for ORM SELECT statements when a current
    tenant is present in the context variable.

    This injects a loader criteria so mapped classes inheriting `TenantMixin`
    have `tenant_id` filtered automatically.
    """
    if not execute_state.is_select:
        return

    # honor explicit bypass flag (super-admin / analytics)
    if getattr(tenancy, "is_bypass_enabled", None) and tenancy.is_bypass_enabled():
        return

    tenant = tenancy.CURRENT_TENANT.get(None)
    if tenant is None:
        return

    # If the caller set execution option `ignore_tenant=True`, opt-out of automatic scoping
    exec_opts = getattr(execute_state, "execution_options", {}) or {}
    if exec_opts.get("ignore_tenant"):
        return

    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(TenantMixin, lambda cls: cls.tenant_id == tenant, include_aliases=True)
    )


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
