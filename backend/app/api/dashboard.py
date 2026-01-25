from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, case, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import datetime

from app.db.session import get_db
from app.models import User, Recognition, PointsLedger, Redemption, Tenant
from app.core.auth import get_current_user, User as CurrentUser
from app.core import tenancy

router = APIRouter(prefix="/dashboard")


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    """Return role-aware dashboard stats.

    - SUPER_ADMIN / PLATFORM_OWNER: global aggregates across tenants.
    - TENANT_ADMIN / TENANT_LEAD: tenant-scoped dashboard with active users, recognitions, points and lead budgets.
    - CORPORATE_USER: personal view (points_balance + small colleague list).
    """
    now = datetime.datetime.utcnow()
    cutoff_30 = now - datetime.timedelta(days=30)

    role = user.role

    # Platform-level / super-admin aggregates
    if role in ("SUPER_ADMIN", "PLATFORM_OWNER"):
        # run without tenant scoping
        with tenancy.without_tenant():
            total_tenants = int((await db.execute(select(func.count(Tenant.id)))).scalar() or 0)
            total_users = int((await db.execute(select(func.count(User.id)))).scalar() or 0)
            total_recognitions = int((await db.execute(select(func.count(Recognition.id)))).scalar() or 0)

            # total points awarded (positive deltas)
            awarded_stmt = select(func.coalesce(func.sum(case((PointsLedger.delta > 0, PointsLedger.delta), else_=0)), 0))
            awarded = int((await db.execute(awarded_stmt)).scalar() or 0)

            return {
                "role": role,
                "total_tenants": total_tenants,
                "total_users": total_users,
                "total_recognitions": total_recognitions,
                "points_awarded_total": awarded,
            }

    # Tenant-level dashboard for leads or tenant admins
    if role in ("TENANT_ADMIN", "TENANT_LEAD"):
        # Tenant scoping is automatic via middleware/context
        # Active users
        active_users = int((await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0)

        # Recognitions in last 30 days
        rec_stmt = select(func.count(Recognition.id)).where(Recognition.created_at >= cutoff_30)
        recognitions_30d = int((await db.execute(rec_stmt)).scalar() or 0)

        # Points distributed (sum of positive deltas in last 30d)
        points_stmt = select(func.coalesce(func.sum(case((PointsLedger.delta > 0, PointsLedger.delta), else_=0)), 0)).where(PointsLedger.created_at >= cutoff_30)
        points_distributed_30d = int((await db.execute(points_stmt)).scalar() or 0)

        # Redemptions last 30d
        red_stmt = select(func.count(Redemption.id), func.coalesce(func.sum(Redemption.points_used), 0)).where(Redemption.created_at >= cutoff_30)
        red_count, red_points = (await db.execute(red_stmt)).one() if (await db.execute(red_stmt)) is not None else (0, 0)
        red_count = int(red_count or 0)
        red_points = int(red_points or 0)

        # Lead budget: master tenant balance + list of leads and their budgets
        tenant_row = await db.execute(select(Tenant.id, Tenant.name, Tenant.master_budget_balance))
        # current tenant will be scoped; grab master balance from first row
        tenant_info = (await db.execute(select(Tenant.id, Tenant.name))).first()

        master_balance = 0
        tenant_meta = None
        t_row = (await db.execute(select(Tenant))).first()
        if t_row:
            # t_row is a Tenant instance
            tenant_inst = t_row[0]
            master_balance = int(tenant_inst.master_budget_balance or 0)
            tenant_meta = {"id": tenant_inst.id, "name": tenant_inst.name, "subdomain": tenant_inst.subdomain}

        leads = []
        lead_rows = (await db.execute(select(User.id, User.full_name, User.lead_budget_balance).where(User.role == "TENANT_LEAD").order_by(desc(User.lead_budget_balance)).limit(10))).all()
        for lid, name, amt in lead_rows:
            leads.append({"id": lid, "name": name or "(unnamed)", "amount_paise": int(amt or 0)})

        # Top employees by points
        top_rows = (await db.execute(select(User.id, User.full_name, User.points_balance).order_by(desc(User.points_balance)).limit(5))).all()
        top_employees = [{"id": r[0], "name": r[1] or "(unnamed)", "points": int(r[2] or 0)} for r in top_rows]

        # Time series - recognitions per day for last 14 days
        days = 14
        labels = []
        counts = []
        for i in range(days, 0, -1):
            day = now - datetime.timedelta(days=i)
            start = datetime.datetime(day.year, day.month, day.day)
            end = start + datetime.timedelta(days=1)
            labels.append(start.strftime("%Y-%m-%d"))
            c = int((await db.execute(select(func.count(Recognition.id)).where(and_(Recognition.created_at >= start, Recognition.created_at < end)))).scalar() or 0)
            counts.append(c)

        return {
            "role": role,
            "tenant": tenant_meta,
            "active_users": active_users,
            "recognitions_30d": recognitions_30d,
            "points_distributed_30d": points_distributed_30d,
            "redemptions_30d": {"count": red_count, "points_spent": red_points},
            "lead_budget": {"master_balance_paise": master_balance, "leads": leads},
            "top_employees": top_employees,
            "time_series": {"labels": labels, "recognitions": counts},
        }

    # Corporate user view
    if role == "CORPORATE_USER":
        # return personal points and a small colleague sample
        me_row = (await db.execute(select(User.id, User.full_name, User.points_balance).where(User.id == user.id))).first()
        if not me_row:
            raise HTTPException(status_code=404, detail="User not found")
        me = {"id": me_row[0], "name": me_row[1] or "(unnamed)", "points": int(me_row[2] or 0)}

        colleagues = []
        col_rows = (await db.execute(select(User.id, User.full_name, User.points_balance).where(and_(User.id != user.id)).limit(5))).all()
        for r in col_rows:
            colleagues.append({"id": r[0], "name": r[1] or "(unnamed)", "points": int(r[2] or 0)})

        return {"role": role, "me": me, "colleagues": colleagues}

    raise HTTPException(status_code=403, detail="Unsupported role for dashboard")
