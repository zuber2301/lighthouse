from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.points_ledger import PointsLedger


async def get_balance(db: AsyncSession, tenant_id: str, user_id: str) -> int:
    stmt = select(func.coalesce(func.sum(PointsLedger.delta), 0)).where(
        PointsLedger.tenant_id == tenant_id,
        PointsLedger.user_id == user_id,
    )
    res = await db.execute(stmt)
    return int(res.scalar() or 0)
