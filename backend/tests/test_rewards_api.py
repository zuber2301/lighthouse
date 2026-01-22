import pytest
import uuid
from httpx import AsyncClient
from app.core.auth import create_access_token
from app.models.users import UserRole
from app.models.rewards import Reward

class TestRewardsAPI:
    @pytest.mark.asyncio
    async def test_list_rewards(self, client):
        response = await client.get("/rewards/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_reward_admin(self, client, tenant_admin_user):
        token = create_access_token({"sub": str(tenant_admin_user.id), "role": tenant_admin_user.role.value, "tenant_id": str(tenant_admin_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {"name": "Test Reward", "points": 100}
        response = await client.post("/rewards/", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["created"] is True

    @pytest.mark.asyncio
    async def test_create_reward_unauthorized(self, client, corporate_user):
        token = create_access_token({"sub": str(corporate_user.id), "role": corporate_user.role.value, "tenant_id": str(corporate_user.tenant_id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {"name": "Evil Reward", "points": 1}
        response = await client.post("/rewards/", json=payload, headers=headers)
        assert response.status_code == 403
