import pytest
import uuid
from datetime import date, timedelta
from app.models.users import User, UserRole
from app.core.auth import create_access_token
from app.services.milestone_service import process_daily_milestones
from app.models.recognition import Recognition
from sqlalchemy import select

import pytest_asyncio

@pytest_asyncio.fixture
async def milestone_users(db_session, tenant_admin_user):
    today = date.today()
    uid = str(uuid.uuid4())[:8]
    
    # Birthday today
    u1 = User(
        email=f"bday_today_{uid}@test.com",
        full_name="Bday Today",
        date_of_birth=today.replace(year=today.year - 30),
        tenant_id=tenant_admin_user.tenant_id,
        role=UserRole.CORPORATE_USER,
        is_active=True
    )
    
    # Anniversary today
    u2 = User(
        email=f"anniv_today_{uid}@test.com",
        full_name="Anniv Today",
        hire_date=today.replace(year=today.year - 2),
        tenant_id=tenant_admin_user.tenant_id,
        role=UserRole.CORPORATE_USER,
        is_active=True
    )
    
    # Upcoming birthday (in 5 days)
    u3 = User(
        email=f"bday_soon_{uid}@test.com",
        full_name="Bday Soon",
        date_of_birth=(today + timedelta(days=5)).replace(year=today.year - 20),
        tenant_id=tenant_admin_user.tenant_id,
        role=UserRole.CORPORATE_USER,
        is_active=True
    )
    
    db_session.add_all([u1, u2, u3])
    await db_session.commit()
    return [u1, u2, u3]

@pytest.mark.asyncio
async def test_milestones_today_api(client, tenant_admin_user, milestone_users):
    token = create_access_token({
        "sub": str(tenant_admin_user.id),
        "role": tenant_admin_user.role.value,
        "tenant_id": str(tenant_admin_user.tenant_id)
    })
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.get("/milestones/today", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 2
    assert any(m['type'] == 'BIRTHDAY' and m['full_name'] == "Bday Today" for m in data)
    assert any(m['type'] == 'ANNIVERSARY' and m['full_name'] == "Anniv Today" for m in data)

@pytest.mark.asyncio
async def test_milestones_upcoming_api(client, tenant_admin_user, milestone_users):
    token = create_access_token({
        "sub": str(tenant_admin_user.id),
        "role": tenant_admin_user.role.value,
        "tenant_id": str(tenant_admin_user.tenant_id)
    })
    headers = {"Authorization": f"Bearer {token}"}
    
    # Look ahead 10 days
    response = await client.get("/milestones/upcoming?days=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Should include Today (2) + Soon (1) = 3
    assert len(data) == 3
    assert any(m['full_name'] == "Bday Soon" for m in data)

@pytest.mark.asyncio
async def test_milestone_automation_service(db_session, milestone_users, tenant_admin_user):
    # Clear any previous recognitions to avoid interference
    from sqlalchemy import delete
    await db_session.execute(delete(Recognition))
    await db_session.commit()

    # We need a Platform Owner to exist for system recognitions
    from app.models.users import UserRole
    platform_owner = User(
        email="system-admin@lighthouse.com",
        full_name="System",
        role=UserRole.PLATFORM_OWNER,
        is_active=True
    )
    db_session.add(platform_owner)
    await db_session.commit()

    # Run the service
    await process_daily_milestones(db_session)
    
    # Check if recognitions were created for our specific users
    user_ids = [u.id for u in milestone_users]
    res = await db_session.execute(
        select(Recognition).where(Recognition.nominee_id.in_(user_ids))
    )
    recs = res.scalars().all()
    assert len(recs) == 2
    
    messages = [r.message for r in recs]
    print(f"DEBUG MESSAGES: {messages}")
    assert any("Happy 30th Birthday" in m for m in messages)
    assert any("Happy 2nd Work Anniversary" in m for m in messages)
