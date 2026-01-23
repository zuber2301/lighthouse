import uuid
import sys
import types

# Provide a lightweight stub for `jose` so tests can import tenancy without
# installing the full dependency. The tenancy module only imports `jwt` and
# `JWTError` at import time; our stub provides those names.
jose_stub = types.SimpleNamespace(jwt=types.SimpleNamespace(decode=lambda *a, **k: {}), JWTError=Exception)
sys.modules.setdefault("jose", jose_stub)

from sqlalchemy import create_engine
from types import SimpleNamespace

# Provide a minimal fake `app.core.config.settings` so importing `app.core.tenancy`
# does not require Pydantic/BaseSettings at test-collection time.
fake_settings = SimpleNamespace(DEV_DEFAULT_TENANT=None, JWT_SECRET="changeme", JWT_ALGORITHM="HS256")
sys.modules.setdefault("app.core.config", types.SimpleNamespace(settings=fake_settings))
from sqlalchemy.orm import sessionmaker, Session

import pytest

from app.core import tenancy
from app.db.base import Base, TenantMixin
from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria


# Register the same Session event listener used by the application so the
# in-memory tests exercise automatic tenant scoping.
@event.listens_for(Session, "do_orm_execute")
def _add_tenant_criteria_for_tests(execute_state):
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
    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(TenantMixin, lambda cls: cls.tenant_id == tenant, include_aliases=True)
    )
from app.models.recognition import Recognition


def make_session():
    # Use a sync SQLite in-memory DB for quick tests; the ORM event listener
    # that applies tenant criteria is registered on sqlalchemy.orm.Session and
    # will run for this Session.
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, class_=Session)
    return SessionLocal()


def test_tenant_scoping_filters_results():
    s = make_session()
    try:
        # create two recognitions for two tenants (use string UUIDs for SQLite compatibility)
        t1 = str(uuid.uuid4())
        t2 = str(uuid.uuid4())

        r1 = Recognition(nominator_id=str(uuid.uuid4()), nominee_id=str(uuid.uuid4()), points=10, tenant_id=t1)
        r2 = Recognition(nominator_id=str(uuid.uuid4()), nominee_id=str(uuid.uuid4()), points=5, tenant_id=t2)

        s.add_all([r1, r2])
        s.commit()

        # When CURRENT_TENANT is set to t1, we should only see r1
        token = tenancy.CURRENT_TENANT.set(t1)
        try:
            rows = s.query(Recognition).all()
            assert len(rows) == 1
            assert rows[0].tenant_id == t1
        finally:
            tenancy.CURRENT_TENANT.reset(token)

    finally:
        s.close()


def test_bypass_returns_all_rows():
    s = make_session()
    try:
        t1 = uuid.uuid4()
        t2 = uuid.uuid4()

        r1 = Recognition(nominator_id=uuid.uuid4(), nominee_id=uuid.uuid4(), points=10, tenant_id=t1)
        r2 = Recognition(nominator_id=uuid.uuid4(), nominee_id=uuid.uuid4(), points=5, tenant_id=t2)

        s.add_all([r1, r2])
        s.commit()

        # Set a tenant to ensure scoping would normally apply
        token = tenancy.CURRENT_TENANT.set(t1)
        try:
            # With bypass context manager, both rows should be visible
            with tenancy.bypass_tenant_context():
                rows = s.query(Recognition).all()
                assert len(rows) == 2
        finally:
            tenancy.CURRENT_TENANT.reset(token)

    finally:
        s.close()
