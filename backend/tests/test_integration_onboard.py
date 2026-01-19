import os
import pathlib
import sqlite3
import json
import tempfile

import pytest


def test_onboard_tenant_end_to_end():
    """Integration test: create an in-memory DB, create tables, get dev token, create tenant, verify DB row."""
    # Use a temp DB for tests
    db_file = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    db_file.close()
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_file.name}"

    try:
        from app.main import app
        from app.db.base import Base
        from app.db.session import engine
        from fastapi.testclient import TestClient
        import asyncio

        # Create tables on the engine used by the app
        async def _create_tables():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        asyncio.run(_create_tables())

        client = TestClient(app)

        # Get a dev token
        r = client.get("/auth/dev-token")
        assert r.status_code == 200, r.text
        token = r.json().get("token")
        assert token

        payload = {
            "name": "IntegrationCo",
            "subdomain": "integrationco",
            "admin_email": "admin@integration.local",
            "admin_name": "Integration Admin",
            "plan_id": 1,
        }

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        r = client.post("/platform/tenants", json=payload, headers=headers)
        assert r.status_code == 200, f"unexpected status {r.status_code}: {r.text}"

        # Verify the tenant exists by querying via SQLAlchemy using the same engine
        async def _check_tenant():
            async with engine.connect() as conn:
                res = await conn.execute(Base.metadata.tables['tenants'].select().where(Base.metadata.tables['tenants'].c.subdomain == payload['subdomain']))
                row = res.fetchone()
                return dict(row) if row else None

        row = asyncio.run(_check_tenant())
        assert row is not None, "tenant row not found in DB"
        assert row['subdomain'] == payload['subdomain']
        tenant_id = row['id']

        # Verify admin user was created
        async def _check_admin_user():
            async with engine.connect() as conn:
                res = await conn.execute(Base.metadata.tables['users'].select().where(Base.metadata.tables['users'].c.email == payload['admin_email']))
                row_user = res.fetchone()
                return dict(row_user) if row_user else None

        admin_row = asyncio.run(_check_admin_user())
        assert admin_row is not None, "admin user not found in DB"
        assert admin_row['email'] == payload['admin_email']

        # Verify tenant subscription row
        async def _check_subscription():
            async with engine.connect() as conn:
                res = await conn.execute(Base.metadata.tables['tenant_subscriptions'].select().where(Base.metadata.tables['tenant_subscriptions'].c.tenant_id == tenant_id))
                row_sub = res.fetchone()
                return dict(row_sub) if row_sub else None

        sub_row = asyncio.run(_check_subscription())
        assert sub_row is not None, "tenant subscription not found"
        assert sub_row['is_active'] in (1, True)

        # Verify budget pool created
        async def _check_budget_pool():
            async with engine.connect() as conn:
                res = await conn.execute(Base.metadata.tables['budget_pools'].select().where(Base.metadata.tables['budget_pools'].c.tenant_id == tenant_id))
                row_bp = res.fetchone()
                return dict(row_bp) if row_bp else None

        bp_row = asyncio.run(_check_budget_pool())
        assert bp_row is not None, "budget pool not found"
        # total_amount may be stored as numeric; ensure it's non-zero
        assert float(bp_row['total_amount']) > 0
    finally:
        os.unlink(db_file.name)