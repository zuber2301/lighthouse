from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.models.transactions import Transaction, TransactionType
from app.models.redemptions import Redemption
from app.models.budget_load_logs import BudgetLoadLog
from typing import Optional, List
from app.schemas.tenant_dashboard import TenantDashboardResponse
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



@router.get('/budget/logs')
async def list_budget_logs(
    limit: int = 50,
    offset: int = 0,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN"))
):
    """Return recent budget load / allocation logs for this tenant (tenant-scoped).

    Supports optional filtering by `transaction_type`, `start_date`, and `end_date`.
    Returns owner name/email when available.
    """
    filters = [BudgetLoadLog.tenant_id == user.tenant_id]
    if transaction_type:
        filters.append(BudgetLoadLog.transaction_type == transaction_type)
    if start_date:
        start_dt = datetime.datetime.combine(start_date, datetime.time.min)
        filters.append(BudgetLoadLog.created_at >= start_dt)
    if end_date:
        end_dt = datetime.datetime.combine(end_date, datetime.time.max)
        filters.append(BudgetLoadLog.created_at <= end_dt)

    stmt = (
        select(BudgetLoadLog, User)
        .outerjoin(User, User.id == BudgetLoadLog.platform_owner_id)
        .where(*filters)
        .order_by(BudgetLoadLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    q = await db.execute(stmt)
    rows = q.all()

    result = []
    for row in rows:
        log = row[0]
        owner = row[1]
        result.append({
            "id": log.id,
            "platform_owner": {
                "id": owner.id if owner else None,
                "full_name": owner.full_name if owner else None,
                "email": owner.email if owner else None,
                "role": owner.role.value if owner and hasattr(owner, 'role') and hasattr(owner.role, 'value') else (owner.role if owner else None)
            },
            "amount": float(log.amount),
            "transaction_type": log.transaction_type,
            "created_at": log.created_at.isoformat() if getattr(log, 'created_at', None) else None
        })

    # total count for pagination
    count_stmt = select(func.count(BudgetLoadLog.id)).where(*filters)
    count_q = await db.execute(count_stmt)
    total = int(count_q.scalar() or 0)

    return {"items": result, "total": total}


@router.get('/budget/logs/{log_id}')
async def get_budget_log(log_id: int, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN"))):
    """Return a single budget load/allocation log with owner resolution for this tenant."""
    stmt = (
        select(BudgetLoadLog, User)
        .outerjoin(User, User.id == BudgetLoadLog.platform_owner_id)
        .where(BudgetLoadLog.id == log_id, BudgetLoadLog.tenant_id == user.tenant_id)
    )
    q = await db.execute(stmt)
    row = q.first()
    if not row:
        raise HTTPException(status_code=404, detail="Log not found")

    log = row[0]
    owner = row[1]
    return {
        "id": log.id,
        "platform_owner": {
            "id": str(owner.id) if owner else None,
            "full_name": owner.full_name if owner else None,
            "email": owner.email if owner else None,
            "role": owner.role.value if owner and hasattr(owner, 'role') and hasattr(owner.role, 'value') else (owner.role if owner else None)
        },
        "amount": float(log.amount),
        "transaction_type": log.transaction_type,
        "created_at": log.created_at.isoformat() if getattr(log, 'created_at', None) else None
    }


@router.get("/dashboard", response_model=TenantDashboardResponse)
async def get_tenant_dashboard(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN", "TENANT_LEAD"))):
    """Aggregate tenant-specific metrics for dashboard"""
    tenant_id = user.tenant_id
    now = datetime.datetime.utcnow()
    days_30 = now - datetime.timedelta(days=30)

    # Active users
    active_q = await db.execute(select(func.count(User.id)).where(User.tenant_id == tenant_id, User.is_active == True))
    active_users = active_q.scalar() or 0

    # Recognitions in last 30 days (count and points)
    recog_q = await db.execute(
        select(func.count(Transaction.id), func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.tenant_id == tenant_id, Transaction.type == TransactionType.RECOGNITION, Transaction.created_at >= days_30)
    )
    recog_count, recog_sum = recog_q.first() or (0, 0)
    # convert paise to points (assuming 100 paise == 1 point)
    points_distributed = int(recog_sum // 100) if recog_sum else 0

    # Redemptions last 30 days
    red_q = await db.execute(
        select(func.count(Redemption.id), func.coalesce(func.sum(Redemption.points_used), 0))
        .where(Redemption.tenant_id == tenant_id, Redemption.created_at >= days_30)
    )
    red_count, red_points = red_q.first() or (0, 0)

    # Lead / master budget
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_q.scalar_one()
    leads_q = await db.execute(select(User).where(User.tenant_id == tenant_id, User.role == UserRole.TENANT_LEAD))
    leads = leads_q.scalars().all()
    lead_balances = [{"id": str(l.id), "name": l.full_name, "amount_paise": l.lead_budget_balance} for l in leads]

    # Top employees by recognition received (sum of amounts)
    top_q = await db.execute(
        select(User.id, User.full_name, func.coalesce(func.sum(Transaction.amount), 0).label('points'))
        .join(Transaction, Transaction.receiver_id == User.id)
        .where(User.tenant_id == tenant_id, Transaction.type == TransactionType.RECOGNITION)
        .group_by(User.id)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
    )
    top = []
    for row in top_q.all():
        uid, name, pts = row
        top.append({"id": str(uid), "name": name, "points": int(pts // 100)})

    # Simple time-series: recognitions per day for last 7 days
    days_7 = now - datetime.timedelta(days=7)
    ts_q = await db.execute(
        select(func.date_trunc('day', Transaction.created_at).label('day'), func.count(Transaction.id))
        .where(Transaction.tenant_id == tenant_id, Transaction.type == TransactionType.RECOGNITION, Transaction.created_at >= days_7)
        .group_by('day')
        .order_by('day')
    )
    ts = {r[0].date().isoformat(): r[1] for r in ts_q.all()}
    labels = []
    values = []
    for i in range(7, 0, -1):
        d = (now - datetime.timedelta(days=i-1)).date()
        labels.append(d.isoformat())
        values.append(ts.get(d.isoformat(), 0))

    return {
        "tenant": {"id": str(tenant.id), "name": tenant.name, "subdomain": tenant.subdomain},
        "active_users": int(active_users),
        "recognitions_30d": int(recog_count or 0),
        "points_distributed_30d": int(points_distributed),
        "redemptions_30d": {"count": int(red_count or 0), "points_spent": int(red_points or 0)},
        "lead_budget": {"master_balance_paise": tenant.master_budget_balance, "leads": lead_balances},
        "top_employees": top,
        "time_series": {"labels": labels, "recognitions": values}
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