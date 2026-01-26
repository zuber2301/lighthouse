import pytest
from app.core.auth import create_access_token

@pytest.mark.asyncio
class TestAdminDashboardAPI:
    async def test_global_stats(self, client, platform_admin_user):
        token = create_access_token({
            "sub": str(platform_admin_user.id),
            "role": platform_admin_user.role.value,
        })
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/admin/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "GLOBAL"
        assert "tenant_health" in data
        assert "system_activity" in data
        assert "financial_liability" in data
        assert "global_milestones" in data

    async def test_tenant_mode(self, client, platform_admin_user, test_tenant):
        token = create_access_token({
            "sub": str(platform_admin_user.id),
            "role": platform_admin_user.role.value,
        })
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/admin/stats", headers=headers, params={"tenant_id": str(test_tenant.id)})
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "TENANT"
        assert data["tenant"]["id"] == str(test_tenant.id)
        assert "department_heatmap" in data
        assert "budget_burn_rate" in data
        assert "leaderboard" in data
        assert "milestone_alerts" in data
        assert "lead_allocations" in data
