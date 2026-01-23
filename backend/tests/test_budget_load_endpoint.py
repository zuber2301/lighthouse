import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.main import app
from app.core.auth import create_access_token
from app.models.budget_load_logs import BudgetLoadLog
from sqlalchemy import select, func
from app.models.users import UserRole


@pytest.mark.asyncio
async def test_load_budget_unauthorized(client):
    resp = await client.post('/platform/load-budget', json={'tenant_id': 'no-id', 'amount': 1000})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_load_budget_forbidden(client, tenant_admin_user):
    token = create_access_token({"sub": str(tenant_admin_user.id), "role": tenant_admin_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.post('/platform/load-budget', json={'tenant_id': tenant_admin_user.tenant_id, 'amount': 1000}, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_load_budget_success(client, platform_admin_user, test_tenant, db_session):
    token = create_access_token({"sub": str(platform_admin_user.id), "role": platform_admin_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    # current balance
    before = float(getattr(test_tenant, 'master_budget_balance', 0))
    resp = await client.post('/platform/load-budget', json={'tenant_id': test_tenant.id, 'amount': 5000}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert 'master_budget_balance' in data

    # verify DB log entry
    q = await db_session.execute(select(func.count(BudgetLoadLog.id)).where(BudgetLoadLog.tenant_id == test_tenant.id))
    cnt = q.scalar() or 0
    assert cnt >= 1
