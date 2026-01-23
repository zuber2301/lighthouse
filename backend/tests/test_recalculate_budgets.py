import pytest
from decimal import Decimal
import pytest_asyncio
from httpx import AsyncClient

from app.core.auth import create_access_token
from sqlalchemy import select
from app.models.budget_load_logs import BudgetLoadLog
from app.models.transactions import Transaction, TransactionType
from app.models.budgets import TenantBudget


@pytest.mark.asyncio
async def test_recalculate_budgets_endpoint(client: AsyncClient, platform_admin_user, test_tenant, db_session):
    # Insert historical budget load logs (amount in rupees)
    bl = BudgetLoadLog(platform_owner_id=platform_admin_user.id, tenant_id=test_tenant.id, amount=Decimal('1234.56'), transaction_type='DEPOSIT')
    db_session.add(bl)

    # Insert some transactions (amounts in paise)
    tx1 = Transaction(tenant_id=test_tenant.id, sender_id=None, receiver_id=platform_admin_user.id, amount=10000, type=TransactionType.ALLOCATE, note='alloc')
    tx2 = Transaction(tenant_id=test_tenant.id, sender_id=None, receiver_id=platform_admin_user.id, amount=25000, type=TransactionType.RECOGNITION, note='rec')
    db_session.add_all([tx1, tx2])

    await db_session.commit()

    # Call endpoint as platform admin
    token = create_access_token({"sub": str(platform_admin_user.id), "role": platform_admin_user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post('/platform/recalculate-budgets', headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert 'updated' in data and data['updated'] >= 1
    assert 'items' in data and any(item['tenant_id'] == str(test_tenant.id) for item in data['items'])

    # Verify TenantBudget row exists and values match expectations
    tb_q = await db_session.execute(select(TenantBudget).where(TenantBudget.tenant_id == test_tenant.id))
    tb = tb_q.scalar_one_or_none()
    assert tb is not None
    # loaded paise should equal 1234.56 * 100
    assert int(tb.total_loaded_paise) == 123456
    # consumed paise should equal tx1+tx2 amounts
    assert int(tb.total_consumed_paise) == 10000 + 25000
