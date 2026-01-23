from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from app.core.rbac import require_role
from app.core.auth import User, get_current_user
from app.db.session import get_db, AsyncSessionLocal
from app.models.rewards import Reward
from app.models.points_ledger import PointsLedger
from app.models.redemptions import Redemption, RedemptionStatus
from app.core import tenancy
from app.core import cache as _cache
from typing import Optional
import uuid
import asyncio
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.redeem_service import redeem_reward as redeem_service
from app.services.points_service import get_balance

router = APIRouter(prefix="/rewards")


@router.get("/")
async def list_rewards(db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Reward))
    rows = q.scalars().all()
    return rows


@router.post("/")
async def create_reward(payload: dict, user: User = Depends(require_role("TENANT_ADMIN"))):
    # Implement creation logic here; ensure tenant scoping using `user.tenant_id`
    return {"created": True, "tenant": user.tenant_id, "created_by": user.id}


@router.post("/{reward_id}/redeem")
async def redeem_reward(
    reward_id: str,
    quantity: Optional[int] = 1,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Redeem a reward for the current user.

    Key points:
    - Balance is derived from SUM(points_ledger.delta) and cached per-user.
    - Redemption and ledger write are performed inside a DB transaction.
    - An async background task will perform external integration (placeholder).
    """
    if quantity is None or quantity < 1:
        quantity = 1

    # service will validate and create redemption + ledger (no commit)
    try:
        redemption = await redeem_service(db=db, tenant_id=str(user.tenant_id), user_id=str(user.id), reward_id=UUID(reward_id))
        await db.commit()
        await db.refresh(redemption)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Invalidate cache only after commit
    user_cache_key = f"balance:{user.tenant_id}:{user.id}"
    try:
        await _cache.invalidate_cached_balance(user_cache_key)
    except Exception:
        pass

    # background processing (provider integration)
    asyncio.create_task(_process_redemption_async(str(redemption.id), str(user.tenant_id)))

    return {"redemption_id": str(redemption.id), "points_used": redemption.points_used}



@router.post("/verify-redeem")
async def verify_redeem(request: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Verify user has enough points and perform a redemption-like flow.

    This is a convenience endpoint mapping to redeem service used by frontends.
    """
    reward_id = request.get("reward_id")
    if not reward_id:
        raise HTTPException(status_code=400, detail="missing reward_id")

    try:
        redemption = await redeem_service(db=db, tenant_id=str(user.tenant_id), user_id=str(user.id), reward_id=UUID(reward_id))
        await db.commit()
        await db.refresh(redemption)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"redemption_id": str(redemption.id), "points_used": redemption.points_used}


async def _process_redemption_async(redemption_id: str, tenant_id: str):
    """Background placeholder for external provider integration.

    This will mark the redemption COMPLETED (or FAILED) once finished.
    In production this should call provider APIs and handle errors, retries,
    notifications, etc.
    """
    # set tenant context so DB-layer scoping works inside this task
    token = tenancy.CURRENT_TENANT.set(tenant_id)
    try:
        # example: simulate external call
        await asyncio.sleep(0.1)

        # update redemption status and set completed_at
        async with AsyncSessionLocal() as session:
            async with session.begin():
                from sqlalchemy import select
                import datetime

                q = await session.execute(select(Redemption).where(Redemption.id == redemption_id))
                r = q.scalars().one_or_none()
                if not r:
                    return
                r.status = RedemptionStatus.COMPLETED
                r.completed_at = datetime.datetime.utcnow()
                session.add(r)
    finally:
        tenancy.CURRENT_TENANT.reset(token)

