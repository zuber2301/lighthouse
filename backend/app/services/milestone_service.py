from datetime import datetime, timedelta
from sqlalchemy import select, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.recognition import Recognition, RecognitionStatus
from app.services.recognition_service import create_recognition, approve_recognition

class MilestonePayload:
    def __init__(self, nominee_id, points, message, value_tag, badge_id=None, is_public=True):
        self.nominee_id = nominee_id
        self.points = points
        self.message = message
        self.value_tag = value_tag
        self.badge_id = badge_id
        self.is_public = is_public

async def process_daily_milestones():
    """
    Check for birthdays and anniversaries today and create system-generated recognitions.
    """
    async with AsyncSessionLocal() as db:
        today = datetime.utcnow()
        month = today.month
        day = today.day

        # Find users with milestones today
        # Note: We filter for users with a tenant_id to avoid processing platform admins
        stmt = select(User).where(
            and_(
                User.is_active == True,
                User.tenant_id != None
            )
        )
        res = await db.execute(stmt)
        users = res.scalars().all()

        for user in users:
            # Check Birthday
            if user.date_of_birth and user.date_of_birth.month == month and user.date_of_birth.day == day:
                await create_system_recognition(db, user, "BIRTHDAY")
            
            # Check Anniversary
            if user.hire_date and user.hire_date.month == month and user.hire_date.day == day:
                years = today.year - user.hire_date.year
                if years > 0:
                    await create_system_recognition(db, user, "ANNIVERSARY", years=years)

        await db.commit()

async def create_system_recognition(db: AsyncSession, user: User, m_type: str, years: int = None):
    # Find a PLATFORM_OWNER to be the "nominator" for system recognitions
    system_nominator_stmt = select(User).where(User.role == UserRole.PLATFORM_OWNER).limit(1)
    nominator_res = await db.execute(system_nominator_stmt)
    system_nominator = nominator_res.scalar_one_or_none()
    
    if not system_nominator:
        # Fallback to the user themselves if no platform owner exists (unlikely in prod)
        nominator_id = user.id
    else:
        nominator_id = system_nominator.id

    if m_type == "BIRTHDAY":
        message = f"Happy Birthday, {user.full_name}! 🎂 We're so glad to have you on the team. Wishing you a wonderful year ahead!"
        value_tag = "Community"
    else:
        message = f"Happy {years} year Work Anniversary, {user.full_name}! 🎉 Thank you for your incredible contribution to {user.department or 'the company'} over the years."
        value_tag = "Legacy"

    payload = MilestonePayload(
        nominee_id=user.id,
        points=100, # Reward them with 100 points for their milestone
        message=message,
        value_tag=value_tag,
        is_public=True
    )

    try:
        rec = await create_recognition(db, user.tenant_id, nominator_id, payload)
        # Auto-approve system recognitions
        await approve_recognition(db, user.tenant_id, rec.id, nominator_id)
        print(f"Created {m_type} recognition for {user.email}")
    except Exception as e:
        print(f"Failed to create {m_type} recognition for {user.email}: {e}")

async def run_milestone_check():
    """Entry point for cron job"""
    await process_daily_milestones()
