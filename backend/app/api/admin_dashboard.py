from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, case, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import datetime

from app.db.session import get_db
from app.core.auth import User as CurrentUser
from app.core.rbac import require_role
from app.core import tenancy
from app.models import Tenant, User, UserRole, Recognition, PointsLedger

router = APIRouter(prefix="/admin")


def _next_occurrence(base_date: datetime.date, today: datetime.date) -> datetime.date:
    next_date = base_date.replace(year=today.year)
    if next_date < today:
        next_date = next_date.replace(year=today.year + 1)
    return next_date


def _years_since(base_date: datetime.date, reference: datetime.date) -> int:
    years = reference.year - base_date.year
    if (base_date.month, base_date.day) > (reference.month, reference.day):
        years -= 1
    return max(years, 0)


@router.get("/stats")
async def admin_stats(
    tenant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN")),
):
    now = datetime.datetime.utcnow()

    if tenant_id:
        with tenancy.without_tenant():
            tenant = (
                await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            ).scalar_one_or_none()
            if not tenant:
                raise HTTPException(status_code=404, detail="Tenant not found")

            heatmap_since = now - datetime.timedelta(days=30)
            heatmap_rows = (await db.execute(
                select(User.department, func.count(Recognition.id).label("count"))
                .join(Recognition, Recognition.nominator_id == User.id)
                .where(
                    User.tenant_id == tenant_id,
                    Recognition.created_at >= heatmap_since,
                )
                .group_by(User.department)
                .order_by(desc("count"))
            )).all()

            department_heatmap = [
                {
                    "department": row[0] or "Unassigned",
                    "activity_score": int(row[1] or 0),
                }
                for row in heatmap_rows
            ]

            burn_series = []
            for offset in range(9, -1, -1):
                day = (now - datetime.timedelta(days=offset)).date()
                start = datetime.datetime(day.year, day.month, day.day)
                end = start + datetime.timedelta(days=1)
                burn_stmt = select(
                    func.coalesce(
                        func.sum(case((PointsLedger.delta < 0, -PointsLedger.delta), else_=0)),
                        0,
                    )
                ).where(
                    PointsLedger.tenant_id == tenant_id,
                    PointsLedger.created_at >= start,
                    PointsLedger.created_at < end,
                )
                spent = int((await db.execute(burn_stmt)).scalar() or 0)
                burn_series.append({
                    "date": day.isoformat(),
                    "points_spent": spent,
                })

            leaderboard_rows = (await db.execute(
                select(
                    User.id,
                    User.full_name,
                    func.count(Recognition.id).label("recognitions"),
                    func.coalesce(func.sum(Recognition.points), 0).label("points"),
                )
                .join(Recognition, Recognition.nominee_id == User.id)
                .where(User.tenant_id == tenant_id)
                .group_by(User.id)
                .order_by(desc("recognitions"), desc("points"))
                .limit(8)
            )).all()

            leaderboard = [
                {
                    "id": str(row[0]),
                    "name": row[1] or "(unnamed)",
                    "recognitions": int(row[2] or 0),
                    "points": int(row[3] or 0),
                }
                for row in leaderboard_rows
            ]

            users = (await db.execute(select(User).where(User.tenant_id == tenant_id))).scalars().all()
            milestone_alerts = []
            today = datetime.date.today()
            for user_row in users:
                if user_row.date_of_birth:
                    next_birthday = _next_occurrence(user_row.date_of_birth, today)
                    days_until = (next_birthday - today).days
                    if days_until <= 30:
                        milestone_alerts.append({
                            "type": "Birthday",
                            "name": user_row.full_name or user_row.email,
                            "date": next_birthday.isoformat(),
                            "value": _years_since(user_row.date_of_birth, today) + 1,
                            "days_until": days_until,
                        })
                if user_row.hire_date:
                    next_anniversary = _next_occurrence(user_row.hire_date, today)
                    days_until = (next_anniversary - today).days
                    if days_until <= 30:
                        milestone_alerts.append({
                            "type": "Anniversary",
                            "name": user_row.full_name or user_row.email,
                            "date": next_anniversary.isoformat(),
                            "value": _years_since(user_row.hire_date, today) + 1,
                            "days_until": days_until,
                        })
            milestone_alerts.sort(key=lambda e: (e["days_until"], e["type"]))

            lead_rows = (await db.execute(
                select(User.id, User.full_name, User.lead_budget_balance)
                .where(
                    User.tenant_id == tenant_id,
                    User.role == UserRole.TENANT_LEAD,
                )
                .order_by(desc(User.lead_budget_balance))
                .limit(10)
            )).all()

            lead_allocations = [
                {
                    "id": str(row[0]),
                    "name": row[1] or "Lead",
                    "budget_paise": int(row[2] or 0),
                }
                for row in lead_rows
            ]

            return {
                "mode": "TENANT",
                "tenant": {
                    "id": str(tenant.id),
                    "name": tenant.name,
                    "master_budget_balance_paise": int(tenant.master_budget_balance or 0),
                },
                "department_heatmap": department_heatmap,
                "budget_burn_rate": burn_series,
                "leaderboard": leaderboard,
                "milestone_alerts": milestone_alerts,
                "lead_allocations": lead_allocations,
            }

    with tenancy.without_tenant():
        tenant_rows = (await db.execute(select(Tenant))).scalars().all()

        tenant_health = []
        for tenant in tenant_rows:
            active_stmt = select(func.count(User.id)).where(User.tenant_id == tenant.id, User.is_active == True)
            active_users = int((await db.execute(active_stmt)).scalar() or 0)

            points_stmt = select(
                func.coalesce(
                    func.sum(case((PointsLedger.delta > 0, PointsLedger.delta), else_=0)),
                    0,
                )
            ).where(PointsLedger.tenant_id == tenant.id)
            total_points = int((await db.execute(points_stmt)).scalar() or 0)

            tenant_health.append({
                "id": str(tenant.id),
                "name": tenant.name,
                "active_users": active_users,
                "total_points_distributed": total_points,
                "master_budget_balance_paise": int(tenant.master_budget_balance or 0),
            })

        total_users_stmt = select(func.count(User.id)).where(User.tenant_id != None)
        total_users = int((await db.execute(total_users_stmt)).scalar() or 0)

        system_activity_since = now - datetime.timedelta(hours=24)
        system_activity_stmt = select(func.count(Recognition.id)).where(Recognition.created_at >= system_activity_since)
        system_activity = int((await db.execute(system_activity_stmt)).scalar() or 0)

        liability_stmt = select(func.coalesce(func.sum(User.points_balance), 0)).where(User.tenant_id != None)
        financial_liability = int((await db.execute(liability_stmt)).scalar() or 0)

        global_milestones = []
        today = datetime.date.today()
        for tenant in tenant_rows:
            if not tenant.created_at:
                continue
            anniversary = _next_occurrence(tenant.created_at.date(), today)
            years = _years_since(tenant.created_at.date(), today) + 1
            days_until = (anniversary - today).days
            global_milestones.append({
                "tenant_id": str(tenant.id),
                "label": f"{tenant.name}: {years} Year Anniversary",
                "date": anniversary.isoformat(),
                "days_until": days_until,
            })

        return {
            "mode": "GLOBAL",
            "total_population": total_users,
            "tenant_health": tenant_health,
            "system_activity": system_activity,
            "financial_liability": financial_liability,
            "global_milestones": sorted(global_milestones, key=lambda e: (e["days_until"], e["tenant_id"])),
        }
