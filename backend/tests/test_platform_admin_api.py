import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi import FastAPI
from app.main import app
from app.core.auth import create_access_token
from app.models.users import UserRole


@pytest_asyncio.fixture
async def client():
    """Create a test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def platform_admin_token(platform_admin_user):
    """Create a JWT token for platform admin."""
    return create_access_token({"sub": platform_admin_user.email, "role": platform_admin_user.role.value})


class TestPlatformAdminAPI:
    @pytest.mark.asyncio
    async def test_get_subscription_plans_unauthorized(self, client):
        """Test getting subscription plans without authentication."""
        response = await client.get("/platform/subscription-plans")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_subscription_plans_wrong_role(self, client, tenant_admin_user):
        """Test getting subscription plans with wrong role."""
        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/platform/subscription-plans", headers=headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_subscription_plans_success(self, client, platform_admin_token, subscription_plan):
        """Test getting subscription plans successfully."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        response = await client.get("/platform/subscription-plans", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Check the structure of the first plan
        plan = data[0]
        assert "id" in plan
        assert "name" in plan
        assert "description" in plan
        assert "monthly_price" in plan
        assert "features" in plan

    @pytest.mark.asyncio
    async def test_onboard_tenant_success(self, client, platform_admin_token, subscription_plan, db_session):
        """Test onboarding a new tenant successfully."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        tenant_data = {
            "name": "New Test Company",
            "subdomain": "newtestcompany",
            "admin_email": "admin@newtestcompany.com",
            "admin_name": "New Admin",
            "plan_id": subscription_plan.id
        }

        response = await client.post("/platform/onboard-tenant", json=tenant_data, headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert "tenant_id" in data
        assert "admin_user_id" in data
        assert "message" in data

    @pytest.mark.asyncio
    async def test_onboard_tenant_duplicate_subdomain(self, client, platform_admin_token, test_tenant, subscription_plan):
        """Test onboarding tenant with duplicate subdomain."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        tenant_data = {
            "name": "Another Company",
            "subdomain": test_tenant.subdomain,  # Duplicate subdomain
            "admin_email": "admin@another.com",
            "admin_name": "Another Admin",
            "plan_id": subscription_plan.id
        }

        response = await client.post("/platform/onboard-tenant", json=tenant_data, headers=headers)
        assert response.status_code == 400
        assert "Subdomain already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_onboard_tenant_duplicate_email(self, client, platform_admin_token, tenant_admin_user, subscription_plan):
        """Test onboarding tenant with duplicate admin email."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        tenant_data = {
            "name": "Another Company",
            "subdomain": "anothercompany",
            "admin_email": tenant_admin_user.email,  # Duplicate email
            "admin_name": "Another Admin",
            "plan_id": subscription_plan.id
        }

        response = await client.post("/platform/onboard-tenant", json=tenant_data, headers=headers)
        assert response.status_code == 400
        assert "Admin email already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_tenant_stats(self, client, platform_admin_token, test_tenant):
        """Test getting tenant statistics."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        response = await client.get("/platform/tenant-stats", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert "total_tenants" in data
        assert "active_tenants" in data
        assert "total_users" in data
        assert isinstance(data["total_tenants"], int)
        assert isinstance(data["active_tenants"], int)

    @pytest.mark.asyncio
    async def test_get_tenants_list(self, client, platform_admin_token, test_tenant):
        """Test getting list of tenants."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        response = await client.get("/platform/tenants", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Check tenant structure
        tenant = data[0]
        assert "id" in tenant
        assert "name" in tenant
        assert "subdomain" in tenant
        assert "status" in tenant


class TestTenantAdminAPI:
    @pytest.mark.asyncio
    async def test_create_tenant_admin_success(self, client, platform_admin_token, test_tenant):
        """Test creating a tenant admin successfully."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        admin_data = {
            "tenant_id": test_tenant.id,
            "email": "newadmin@testcompany.com",
            "full_name": "New Tenant Admin"
        }

        response = await client.post("/platform/create-tenant-admin", json=admin_data, headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert "user_id" in data
        assert "message" in data

    @pytest.mark.asyncio
    async def test_create_tenant_admin_duplicate_email(self, client, platform_admin_token, test_tenant, tenant_admin_user):
        """Test creating tenant admin with duplicate email."""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}

        admin_data = {
            "tenant_id": test_tenant.id,
            "email": tenant_admin_user.email,  # Duplicate email
            "full_name": "Duplicate Admin"
        }

        response = await client.post("/platform/create-tenant-admin", json=admin_data, headers=headers)
        assert response.status_code == 400
        assert "Email already exists" in response.json()["detail"]