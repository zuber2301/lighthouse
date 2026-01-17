import pytest
from httpx import AsyncClient
from app.core.auth import create_access_token
from app.models.users import UserRole
from app.models.recognition import RecognitionStatus


class TestRecognitionAPI:
    @pytest.mark.asyncio
    async def test_list_recognitions_unauthorized(self, client):
        """Test listing recognitions without authentication."""
        response = await client.get("/recognition/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_recognitions_empty(self, client, tenant_admin_user):
        """Test listing recognitions when none exist."""
        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/recognition/", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_create_recognition_success(self, client, tenant_admin_user, db_session):
        """Test creating a recognition successfully."""
        from app.models.users import User

        # Create another user to recognize
        nominee = User(
            email="nominee@testcompany.com",
            full_name="Test Nominee",
            role=UserRole.CORPORATE_USER,
            tenant_id=tenant_admin_user.tenant_id,
            is_active=True
        )
        db_session.add(nominee)
        await db_session.commit()
        await db_session.refresh(nominee)

        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        recognition_data = {
            "nominee_id": nominee.id,
            "points": 50,
            "message": "Great work on the project!"
        }

        response = await client.post("/recognition/", json=recognition_data, headers=headers)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert data["nominee_id"] == nominee.id
        assert data["points"] == 50
        assert data["status"] == RecognitionStatus.PENDING.value

    @pytest.mark.asyncio
    async def test_create_recognition_invalid_nominee(self, client, tenant_admin_user):
        """Test creating recognition with invalid nominee ID."""
        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        recognition_data = {
            "nominee_id": "invalid-uuid",
            "points": 50,
            "message": "Great work!"
        }

        response = await client.post("/recognition/", json=recognition_data, headers=headers)
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_approve_recognition_success(self, client, tenant_admin_user, db_session):
        """Test approving a recognition."""
        from app.models.recognition import Recognition

        # Create a pending recognition
        recognition = Recognition(
            nominator_id=tenant_admin_user.id,
            nominee_id=tenant_admin_user.id,  # Self-recognition for simplicity
            points=25,
            tenant_id=tenant_admin_user.tenant_id,
            status=RecognitionStatus.PENDING
        )
        db_session.add(recognition)
        await db_session.commit()
        await db_session.refresh(recognition)

        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(f"/recognition/{recognition.id}/approve", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == recognition.id
        assert data["status"] == RecognitionStatus.APPROVED.value

    @pytest.mark.asyncio
    async def test_approve_recognition_not_found(self, client, tenant_admin_user):
        """Test approving a non-existent recognition."""
        import uuid
        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        fake_id = str(uuid.uuid4())
        response = await client.post(f"/recognition/{fake_id}/approve", headers=headers)
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_list_recognitions_with_data(self, client, tenant_admin_user, db_session):
        """Test listing recognitions with existing data."""
        from app.models.recognition import Recognition

        # Create some recognitions
        recognition1 = Recognition(
            nominator_id=tenant_admin_user.id,
            nominee_id=tenant_admin_user.id,
            points=100,
            tenant_id=tenant_admin_user.tenant_id,
            status=RecognitionStatus.APPROVED,
            message="Outstanding performance!"
        )
        recognition2 = Recognition(
            nominator_id=tenant_admin_user.id,
            nominee_id=tenant_admin_user.id,
            points=50,
            tenant_id=tenant_admin_user.tenant_id,
            status=RecognitionStatus.PENDING,
            message="Good job!"
        )
        db_session.add_all([recognition1, recognition2])
        await db_session.commit()

        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/recognition/", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

        # Check structure
        recognition = data[0]
        assert "id" in recognition
        assert "nominee_id" in recognition
        assert "points" in recognition
        assert "status" in recognition

    @pytest.mark.asyncio
    async def test_recognition_pagination(self, client, tenant_admin_user, db_session):
        """Test recognition listing pagination."""
        from app.models.recognition import Recognition

        # Create multiple recognitions
        recognitions = []
        for i in range(5):
            rec = Recognition(
                nominator_id=tenant_admin_user.id,
                nominee_id=tenant_admin_user.id,
                points=10 * (i + 1),
                tenant_id=tenant_admin_user.tenant_id,
                status=RecognitionStatus.APPROVED,
                message=f"Recognition {i+1}"
            )
            recognitions.append(rec)

        db_session.add_all(recognitions)
        await db_session.commit()

        token = create_access_token({"sub": tenant_admin_user.email, "role": tenant_admin_user.role.value})
        headers = {"Authorization": f"Bearer {token}"}

        # Test limit
        response = await client.get("/recognition/?limit=2", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2

        # Test offset
        response = await client.get("/recognition/?offset=2&limit=2", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2