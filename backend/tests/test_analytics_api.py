import pytest
from app.core.auth import create_access_token
from app.models.users import UserRole

class TestAnalyticsAPI:
    @pytest.mark.asyncio
    async def test_frequency_unauthorized(self, client, corporate_user):
        token = create_access_token({"sub": str(corporate_user.id), "role": corporate_user.role.value, "tenant_id": str(corporate_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/analytics/recognitions/frequency", headers=headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_frequency_admin(self, client, tenant_admin_user):
        token = create_access_token({"sub": str(tenant_admin_user.id), "role": tenant_admin_user.role.value, "tenant_id": str(tenant_admin_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/analytics/recognitions/frequency", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_budget_utilization(self, client, tenant_admin_user):
        token = create_access_token({"sub": str(tenant_admin_user.id), "role": tenant_admin_user.role.value, "tenant_id": str(tenant_admin_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/analytics/budget/utilization", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_awarded" in data
        assert "total_redeemed" in data
        assert "net" in data

    @pytest.mark.asyncio
    async def test_summary(self, client):
        response = await client.get("/analytics/summary")
        assert response.status_code == 200
        assert "summary" in response.json()
