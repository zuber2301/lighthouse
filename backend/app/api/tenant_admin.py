from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.models.transactions import Transaction, TransactionType
from typing import Optional, List
import datetime
from pydantic import BaseModel


class LoadBudgetRequest(BaseModel):
    amount: int  # Amount in rupees (will be converted to paise internally)


class AllocateBudgetRequest(BaseModel):
    lead_id: str
    amount: int  # Amount in rupees


class PromoteUserRequest(BaseModel):
    role: UserRole


router = APIRouter(prefix="/tenant")


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """List all users in the tenant"""
    q = await db.execute(select(User).where(User.tenant_id == user.tenant_id))
    users = q.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "points_balance": u.points_balance,
            "lead_budget_balance": u.lead_budget_balance,
            "is_active": u.is_active
        }
        for u in users
    ]


@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, request: PromoteUserRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """Promote a user to Tenant Lead"""
    # Verify user exists and belongs to same tenant
    user_q = await db.execute(select(User).where(User.id == user_id, User.tenant_id == user.tenant_id))
    target_user = user_q.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update role
    target_user.role = request.role
    await db.commit()
    
    # Create transaction record for role change
    transaction = Transaction(
        tenant_id=user.tenant_id,
        sender_id=user.id,
        receiver_id=user_id,
        amount=0,
        type=TransactionType.ALLOCATE,
        note=f"User promoted to {request.role.value}"
    )
    db.add(transaction)
    await db.commit()
    
    return {"id": str(target_user.id), "role": target_user.role.value}


@router.post("/budget/load")
async def load_master_budget(request: LoadBudgetRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """Add money to the company's master budget"""
    amount_paise = request.amount * 100  # Convert rupees to paise
    
    # Update tenant's master budget
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_q.scalar_one()
    tenant.master_budget_balance += amount_paise
    await db.commit()
    
    # Create transaction record
    transaction = Transaction(
        tenant_id=user.tenant_id,
        sender_id=None,  # System/Platform
        receiver_id=user.id,
        amount=amount_paise,
        type=TransactionType.LOAD,
        note=f"Master budget loaded with ₹{request.amount}"
    )
    db.add(transaction)
    await db.commit()
    
    return {"master_balance": tenant.master_budget_balance}


@router.post("/budget/allocate")
async def allocate_to_lead(request: AllocateBudgetRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """Transfer funds from Master Budget to a specific Tenant Lead"""
    amount_paise = request.amount * 100  # Convert rupees to paise
    
    # Verify lead exists and is in same tenant
    lead_q = await db.execute(
        select(User).where(
            User.id == request.lead_id,
            User.tenant_id == user.tenant_id,
            User.role == UserRole.TENANT_LEAD
        )
    )
    lead = lead_q.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Tenant Lead not found")
    
    # Check if master budget has sufficient funds
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_q.scalar_one()
    if tenant.master_budget_balance < amount_paise:
        raise HTTPException(status_code=400, detail="Insufficient master budget")
    
    # Transfer funds
    tenant.master_budget_balance -= amount_paise
    lead.lead_budget_balance += amount_paise
    await db.commit()
    
    # Create transaction record
    transaction = Transaction(
        tenant_id=user.tenant_id,
        sender_id=user.id,
        receiver_id=request.lead_id,
        amount=amount_paise,
        type=TransactionType.ALLOCATE,
        note=f"Allocated ₹{request.amount} to lead budget"
    )
    db.add(transaction)
    await db.commit()
    
    return {
        "master_balance": tenant.master_budget_balance,
        "lead_budget": lead.lead_budget_balance
    }


@router.get("/budget")
async def get_budget_status(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """Get current budget status"""
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_q.scalar_one()
    
    leads_q = await db.execute(
        select(User).where(
            User.tenant_id == user.tenant_id,
            User.role == UserRole.TENANT_LEAD
        )
    )
    leads = leads_q.scalars().all()
    
    return {
        "master_budget": tenant.master_budget_balance,
        "leads": [
            {
                "id": str(lead.id),
                "name": lead.full_name,
                "budget": lead.lead_budget_balance
            }
            for lead in leads
        ]
    }


@router.get("/budgets")
async def list_budget_pools(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN")), request: Request = None):
    tenant = getattr(request.state, "tenant_id", None)
    q = await db.execute(select(BudgetPool).where(BudgetPool.tenant_id == tenant))
    pools = q.scalars().all()
    result = []
    for pool in pools:
        # Get allocations
        q2 = await db.execute(select(DepartmentBudget).where(DepartmentBudget.budget_pool_id == pool.id))
        allocations = q2.scalars().all()
        result.append({
            "id": pool.id,
            "period": pool.period,
            "total_amount": str(pool.total_amount),
            "allocations": [{"department_id": a.department_id, "allocated": str(a.allocated_amount), "used": str(a.used_amount)} for a in allocations]
        })
    return result