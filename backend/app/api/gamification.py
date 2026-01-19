from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.session import get_db
from app.models.points_ledger import PointsLedger

router = APIRouter(prefix="/gamification")


@router.get("/leaderboard")
async def leaderboard(request: Request, db: AsyncSession = Depends(get_db), limit: int = 50):
    tenant = getattr(request.state, "tenant_id", None)
    # Calculate first day of current month in UTC
    now = datetime.utcnow()
    start = datetime(now.year, now.month, 1)

    stmt = (
        select(PointsLedger.user_id, func.sum(PointsLedger.delta).label("points"))
        .where(PointsLedger.tenant_id == tenant, PointsLedger.created_at >= start)
        .group_by(PointsLedger.user_id)
        .order_by(func.sum(PointsLedger.delta).desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    rows = res.all()
    return [{"user_id": r[0], "points": int(r[1])} for r in rows]
