from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.users import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("/upcoming")
async def get_upcoming_milestones(request: Request, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user), days: int = 30):
    """
    Returns users celebrating milestones in the next X days.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        tenant_id = getattr(current_user, 'tenant_id', None)

    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days)
    
    stmt = select(User).where(User.tenant_id == tenant_id, User.is_active == True)
    res = await db.execute(stmt)
    users = res.scalars().all()
    
    upcoming = []
    for u in users:
        # Check birthday
        if u.date_of_birth:
            try:
                next_bday = u.date_of_birth.replace(year=today.year)
            except ValueError: # Leap year case (Feb 29)
                next_bday = u.date_of_birth.replace(year=today.year, month=3, day=1)

            if next_bday < today:
                try:
                    next_bday = next_bday.replace(year=today.year + 1)
                except ValueError:
                    next_bday = next_bday.replace(year=today.year + 1, month=3, day=1)
            
            if today <= next_bday <= end_date:
                upcoming.append({
                    "user_id": u.id,
                    "full_name": u.full_name,
                    "type": "BIRTHDAY",
                    "date": next_bday.isoformat(),
                    "days_away": (next_bday - today).days,
                    "department": u.department
                })

        # Check anniversary
        if u.hire_date:
            try:
                next_anniv = u.hire_date.replace(year=today.year)
            except ValueError:
                 next_anniv = u.hire_date.replace(year=today.year, month=3, day=1)

            if next_anniv < today:
                try:
                    next_anniv = next_anniv.replace(year=today.year + 1)
                except ValueError:
                    next_anniv = next_anniv.replace(year=today.year + 1, month=3, day=1)
            
            if today <= next_anniv <= end_date:
                years = next_anniv.year - u.hire_date.year
                if years > 0:
                    upcoming.append({
                        "user_id": u.id,
                        "full_name": u.full_name,
                        "type": "ANNIVERSARY",
                        "date": next_anniv.isoformat(),
                        "days_away": (next_anniv - today).days,
                        "years": years,
                        "department": u.department
                    })

    upcoming.sort(key=lambda x: x['days_away'])
    return upcoming


@router.get("/today")
async def get_today_milestones(request: Request, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Returns users celebrating birthdays or work anniversaries today within the current tenant.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        # If no tenant context, fallback to current user's tenant
        tenant_id = getattr(current_user, 'tenant_id', None)

    today = datetime.utcnow()
    month = today.month
    day = today.day

    # Birthdays
    bday_stmt = select(User).where(
        User.tenant_id == tenant_id,
        extract('month', User.date_of_birth) == month,
        extract('day', User.date_of_birth) == day
    )
    bday_res = await db.execute(bday_stmt)
    birthdays = bday_res.scalars().all()

    # Anniversaries
    anniv_stmt = select(User).where(
        User.tenant_id == tenant_id,
        extract('month', User.hire_date) == month,
        extract('day', User.hire_date) == day
    )
    anniv_res = await db.execute(anniv_stmt)
    anniversaries = anniv_res.scalars().all()

    results = []
    for b in birthdays:
        results.append({
            "user_id": b.id,
            "full_name": b.full_name,
            "department": b.department,
            "type": "BIRTHDAY",
            "job_title": b.job_title
        })
    
    for a in anniversaries:
        years = today.year - a.hire_date.year
        if years > 0: # Only report if at least 1 year has passed
            results.append({
                "user_id": a.id,
                "full_name": a.full_name,
                "department": a.department,
                "type": "ANNIVERSARY",
                "years": years,
                "job_title": a.job_title
            })

    return results
