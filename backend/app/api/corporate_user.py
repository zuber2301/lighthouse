from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.models.transactions import Transaction, TransactionType
from app.models.global_rewards import GlobalReward
from app.models.redemptions import Redemption, RedemptionStatus
from typing import Optional, List
from pydantic import BaseModel


class RedeemPointsRequest(BaseModel):
    reward_id: str


router = APIRouter(prefix="/user")


@router.get("/points")
async def get_points_balance(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("CORPORATE_USER"))):
    """View current points and recognition history"""
    # Load the ORM User record so we can access and mutate DB-backed balances
    user_q = await db.execute(select(User).where(User.id == user.id))
    db_user = user_q.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get recognition history
    recognitions_q = await db.execute(
        select(Transaction)
        .where(
            Transaction.receiver_id == user.id,
            Transaction.type == TransactionType.RECOGNITION
        )
        .order_by(Transaction.created_at.desc())
        .limit(20)
    )
    recognitions = recognitions_q.scalars().all()

    return {
        "points_balance": db_user.points_balance,
        "recognition_history": [
            {
                "amount": tx.amount // 100,  # Convert paise to points
                "note": tx.note,
                "date": tx.created_at.isoformat(),
                "sender_id": tx.sender_id
            }
            for tx in recognitions
        ]
    }


@router.post("/redeem")
async def redeem_points(request: RedeemPointsRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("CORPORATE_USER"))):
    """Purchase a gift card from the catalog"""
    # Get the reward
    reward_q = await db.execute(select(GlobalReward).where(GlobalReward.id == request.reward_id))
    reward = reward_q.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    if not reward.is_enabled:
        raise HTTPException(status_code=400, detail="Reward not available")
    
    # Load ORM user and check balance
    user_q = await db.execute(select(User).where(User.id == user.id))
    db_user = user_q.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has sufficient points
    if db_user.points_balance < reward.points_cost:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Deduct points
    db_user.points_balance -= reward.points_cost
    await db.commit()
    
    # Create redemption record
    redemption = Redemption(
        user_id=user.id,
        reward_id=request.reward_id,
        points_spent=reward.points_cost,
        status=RedemptionStatus.PENDING
    )
    db.add(redemption)
    await db.commit()
    
    # Create transaction record
    transaction = Transaction(
        tenant_id=user.tenant_id,
        sender_id=user.id,
        receiver_id=None,  # Platform/System
        amount=reward.points_cost * 100,  # Convert points to paise
        type=TransactionType.REDEMPTION,
        note=f"Redeemed: {reward.title}"
    )
    db.add(transaction)
    await db.commit()
    
    return {
        "redemption_id": str(redemption.id),
        "points_remaining": db_user.points_balance,
        "reward_title": reward.title,
        "status": redemption.status.value
    }


@router.get("/rewards")
async def get_available_rewards(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("CORPORATE_USER"))):
    """Get available rewards catalog"""
    # Load ORM user to determine affordability
    user_q = await db.execute(select(User).where(User.id == user.id))
    db_user = user_q.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    rewards_q = await db.execute(select(GlobalReward).where(GlobalReward.is_enabled == True))
    rewards = rewards_q.scalars().all()

    return [
        {
            "id": str(r.id),
            "title": r.title,
            "provider": r.provider,
            "points_cost": r.points_cost,
            "can_afford": db_user.points_balance >= r.points_cost
        }
        for r in rewards
    ]


@router.get("/redemptions")
async def get_redemption_history(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("CORPORATE_USER"))):
    """Get user's redemption history"""
    redemptions_q = await db.execute(
        select(Redemption, GlobalReward)
        .join(GlobalReward, Redemption.reward_id == GlobalReward.id)
        .where(Redemption.user_id == user.id)
        .order_by(Redemption.created_at.desc())
    )
    redemptions = redemptions_q.all()
    
    return [
        {
            "id": str(r[0].id),
            "reward_title": r[1].title,
            "points_spent": r[0].points_spent,
            "status": r[0].status.value,
            "date": r[0].created_at.isoformat()
        }
        for r in redemptions
    ]