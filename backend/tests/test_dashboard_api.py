import pytest
from app.core.auth import create_access_token

class TestDashboardAPI:
    @pytest.mark.asyncio
    async def test_platform_owner_view(self, client, platform_admin_user):
        token = create_access_token({"sub": str(platform_admin_user.id), "role": platform_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "role" in data
        assert data["role"] == platform_admin_user.role.value
        assert "total_tenants" in data
        assert "total_users" in data

    @pytest.mark.asyncio
    async def test_tenant_admin_view(self, client, tenant_admin_user):
        token = create_access_token({"sub": str(tenant_admin_user.id), "role": tenant_admin_user.role.value, "tenant_id": str(tenant_admin_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "active_users" in data
        assert "recognitions_30d" in data
        assert "lead_budget" in data
        assert "time_series" in data

    @pytest.mark.asyncio
    async def test_corporate_user_view(self, client, corporate_user):
        token = create_access_token({"sub": str(corporate_user.id), "role": corporate_user.role.value, "tenant_id": str(corporate_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "me" in data
        assert data["me"]["id"] == str(corporate_user.id)
        assert "colleagues" in data
