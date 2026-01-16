from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound
from app.models.rewards import Reward
from app.models.redemptions import Redemption, RedemptionStatus
from app.models.points_ledger import PointsLedger
from app.models.users import User
from uuid import UUID
from app.services.points_service import get_balance


async def redeem_reward(db: AsyncSession, tenant_id: str, user_id: str, reward_id: UUID):
    # load reward and ensure tenant & active
    res = await db.execute(select(Reward).where(Reward.id == reward_id, Reward.tenant_id == tenant_id, Reward.is_active == True))
    reward = res.scalar_one_or_none()
    if not reward:
        raise NoResultFound("Reward not found")

    # lock the user row to avoid concurrent redemptions
    await db.execute(select(User).where(User.id == user_id).with_for_update())

    balance = await get_balance(db, tenant_id, user_id)
    if balance < reward.cost_points:
        raise ValueError("Insufficient points")

    redemption = Redemption(
        tenant_id=tenant_id,
        user_id=user_id,
        reward_id=reward.id,
        points_used=reward.cost_points,
        status=RedemptionStatus.PENDING,
    )
    debit = PointsLedger(
        tenant_id=tenant_id,
        user_id=user_id,
        delta=-int(reward.cost_points),
        reason="REWARD_REDEMPTION",
        reference_id=redemption.id,
    )

    db.add_all([redemption, debit])
    await db.flush()
    return redemption
