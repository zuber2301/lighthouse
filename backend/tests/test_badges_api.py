import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.core.auth import create_access_token
from app.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


class TestBadgesAPI:
    @pytest.mark.asyncio
    async def test_create_and_get_badge(self, client, tenant_admin_user):
        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        badge_payload = {
            "name": "Unit Test Badge",
            "icon_url": None,
            "points_value": 25,
            "category": "Value-based"
        }

        # create badge
        resp = await client.post("/badges/", json=badge_payload, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Unit Test Badge"
        badge_id = data["id"]

        # get badge
        resp = await client.get(f"/badges/{badge_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == badge_id

    @pytest.mark.asyncio
    async def test_post_recognition_with_badge(self, client, tenant_admin_user, db_session):
        # create nominee
        from app.models.users import User, UserRole

        nominee = User(
            email="testnominee@example.com",
            full_name="Test Nominee",
            role=UserRole.CORPORATE_USER,
            tenant_id=tenant_admin_user.tenant_id,
            is_active=True,
        )
        db_session.add(nominee)
        await db_session.commit()
        await db_session.refresh(nominee)

        # create badge directly in DB
        from app.models.badges import Badge

        badge = Badge(
            tenant_id=tenant_admin_user.tenant_id,
            name="Integration Badge",
            points_value=10,
        )
        db_session.add(badge)
        await db_session.commit()
        await db_session.refresh(badge)

        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        recognition_payload = {
            "nominee_id": nominee.id,
            "points": 10,
            "badge_id": badge.id,
            "message": "Great job",
            "is_public": True,
        }

        resp = await client.post("/recognitions/", json=recognition_payload, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["nominee_id"] == nominee.id
        assert data.get("badge_id") == badge.id
