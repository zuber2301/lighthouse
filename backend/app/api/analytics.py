from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import datetime

from app.db.session import get_db
from app.models import Recognition, PointsLedger, Redemption, User
from app.models.redemptions import RedemptionStatus
from app.core.auth import get_current_user, User as CurrentUser
from app.core.rbac import require_role
from app.core import tenancy

router = APIRouter(prefix="/analytics")


def _ensure_aggregate_allowed(user: CurrentUser, aggregate: bool):
    if aggregate and user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Aggregate view requires SUPER_ADMIN role")


@router.get("/recognitions/frequency")
async def recognition_frequency(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
    aggregate: bool = False,
    limit: int = 100,
):
    """Returns counts of recognitions received per user.

    Tenant-scoped by default. SUPER_ADMIN may set `aggregate=true` to view across tenants.
    """
    _ensure_aggregate_allowed(user, aggregate)

    if aggregate:
        ctx = tenancy.without_tenant()
    else:
        ctx = None

    with ctx if ctx else dummy_context():
        stmt = (
            select(Recognition.nominee_id, func.count(Recognition.id).label("count"))
            .group_by(Recognition.nominee_id)
            .order_by(func.count(Recognition.id).desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        rows = res.all()
        return [{"user_id": r[0], "count": int(r[1])} for r in rows]


@router.get("/budget/utilization")
async def budget_utilization(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
    aggregate: bool = False,
):
    """Compute simple budget metrics: total_awarded (positive deltas), total_redeemed (negative deltas)

    Tenant-scoped by default.
    """
    _ensure_aggregate_allowed(user, aggregate)
    if aggregate:
        ctx = tenancy.without_tenant()
    else:
        ctx = None

    with ctx if ctx else dummy_context():
        awarded_stmt = select(func.coalesce(func.sum(case([(PointsLedger.delta > 0, PointsLedger.delta)], else_=0)), 0))
        redeemed_stmt = select(func.coalesce(func.sum(case([(PointsLedger.delta < 0, -PointsLedger.delta)], else_=0)), 0))

        a = await db.execute(awarded_stmt)
        r = await db.execute(redeemed_stmt)
        total_awarded = int(a.scalar() or 0)
        total_redeemed = int(r.scalar() or 0)
        net = total_awarded - total_redeemed
        return {"total_awarded": total_awarded, "total_redeemed": total_redeemed, "net": net}


@router.get("/recognitions/manager_vs_peer")
async def manager_vs_peer(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
    aggregate: bool = False,
):
    """Counts of recognitions by nominator role (MANAGER vs others).

    Tenant-scoped by default.
    """
    _ensure_aggregate_allowed(user, aggregate)
    if aggregate:
        ctx = tenancy.without_tenant()
    else:
        ctx = None

    with ctx if ctx else dummy_context():
        # join Recognition -> User (nominator)
        stmt = (
            select(User.role, func.count(Recognition.id))
            .join(Recognition, Recognition.nominator_id == User.id)
            .group_by(User.role)
        )
        res = await db.execute(stmt)
        rows = res.all()
        return [{"role": r[0].value if hasattr(r[0], "value") else str(r[0]), "count": int(r[1])} for r in rows]


@router.get("/redemptions/velocity")
async def redemption_velocity(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
    aggregate: bool = False,
    sample_limit: int = 1000,
):
    """Average time (seconds) between redemption creation and completion for completed redemptions.

    Tenant-scoped by default. This is computed in Python for portability across DBs.
    """
    _ensure_aggregate_allowed(user, aggregate)
    if aggregate:
        ctx = tenancy.without_tenant()
    else:
        ctx = None

    with ctx if ctx else dummy_context():
        stmt = (
            select(Redemption.created_at, Redemption.completed_at)
            .where(Redemption.status == RedemptionStatus.COMPLETED)
            .limit(sample_limit)
        )
        res = await db.execute(stmt)
        rows = res.all()
        deltas = []
        for created, completed in rows:
            if not created or not completed:
                continue
            if isinstance(created, datetime.datetime) and isinstance(completed, datetime.datetime):
                delta = (completed - created).total_seconds()
                if delta >= 0:
                    deltas.append(delta)
        if not deltas:
            return {"average_seconds": None, "samples": 0}
        avg = sum(deltas) / len(deltas)
        return {"average_seconds": avg, "samples": len(deltas)}


# small helper dummy context manager
class _DummyCtx:
    def __enter__(self):
        return None

    def __exit__(self, exc_type, exc, tb):
        return False


def dummy_context():
    return _DummyCtx()
from fastapi import APIRouter

router = APIRouter(prefix="/analytics")

@router.get("/summary")
async def summary():
    return {"summary": {}}
