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
from typing import Optional, List
from pydantic import BaseModel


class RecognizeUserRequest(BaseModel):
    user_id: str
    amount: int  # Points to give
    note: Optional[str] = None
    category: Optional[str] = "Individual award"


class RedeemPointsRequest(BaseModel):
    reward_id: str


router = APIRouter(prefix="/lead")


@router.post("/recognize")
async def recognize_user(request: RecognizeUserRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_LEAD"))):
    """Give points to a Corporate User (Deducts from Lead's budget)"""
    amount_paise = request.amount * 100  # Convert points to paise (1 point = ₹1)
    
    # Verify user exists and is in same tenant
    user_q = await db.execute(
        select(User).where(
            User.id == request.user_id,
            User.tenant_id == user.tenant_id,
            User.role == UserRole.CORPORATE_USER
        )
    )
    target_user = user_q.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Corporate User not found")
    
    # Check if lead has sufficient budget
    if user.lead_budget_balance < amount_paise:
        raise HTTPException(status_code=400, detail="Insufficient lead budget")
    
    # Transfer points
    user.lead_budget_balance -= amount_paise
    target_user.points_balance += request.amount  # Points balance is in points, not paise
    await db.commit()
    
    # Create transaction record
    transaction = Transaction(
        tenant_id=user.tenant_id,
        sender_id=user.id,
        receiver_id=request.user_id,
        amount=amount_paise,
        type=TransactionType.RECOGNITION,
        note=request.note or f"{request.category or 'Recognition'}: {request.amount} points"
    )
    db.add(transaction)
    await db.commit()
    
    return {
        "user_points": target_user.points_balance,
        "lead_budget_remaining": user.lead_budget_balance
    }


@router.get("/team")
async def get_team_performance(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_LEAD"))):
    """View department performance"""
    # Get all corporate users in the tenant
    users_q = await db.execute(
        select(User).where(
            User.tenant_id == user.tenant_id,
            User.role == UserRole.CORPORATE_USER
        )
    )
    users = users_q.scalars().all()
    
    # Get recent recognitions (transactions)
    recent_recognitions_q = await db.execute(
        select(Transaction, User)
        .join(User, Transaction.receiver_id == User.id)
        .where(
            Transaction.tenant_id == user.tenant_id,
            Transaction.type == TransactionType.RECOGNITION
        )
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    recent_recognitions = recent_recognitions_q.all()
    
    return {
        "team_members": [
            {
                "id": str(u.id),
                "name": u.full_name,
                "points_balance": u.points_balance
            }
            for u in users
        ],
        "recent_recognitions": [
            {
                "user_name": tx[1].full_name,
                "points": tx[0].amount // 100,  # Convert paise back to points
                "note": tx[0].note,
                "date": tx[0].created_at.isoformat()
            }
            for tx in recent_recognitions
        ]
    }


@router.get("/budget")
async def get_lead_budget(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_LEAD"))):
    """Get current lead budget"""
    return {"budget_balance": user.lead_budget_balance}