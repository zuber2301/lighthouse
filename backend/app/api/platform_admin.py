from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.users import User, UserRole
from app.models.platform import PlatformSettings
from app.models.budgets import BudgetPool
from app.models.subscriptions import SubscriptionPlan, TenantSubscription
from app.models.global_rewards import GlobalReward
from app.models.audit_logs import PlatformAuditLog
from app.models.transactions import Transaction, TransactionType
from app.models.recognition import Recognition
from typing import Optional, List
import datetime
import uuid
from pydantic import BaseModel
from sqlalchemy import desc


class OnboardTenantRequest(BaseModel):
    name: str
    subdomain: str
    admin_email: str
    admin_name: str
    plan_id: int


class CreateTenantAdminRequest(BaseModel):
    tenant_id: str
    email: str
    full_name: str


class GlobalRewardRequest(BaseModel):
    title: str
    provider: Optional[str] = None
    points_cost: int


router = APIRouter(prefix="/platform")


@router.get("/subscription-plans")
async def get_subscription_plans(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))):
    result = await db.execute(select(SubscriptionPlan))
    plans = result.scalars().all()
    
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "monthly_price_in_paise": plan.monthly_price_in_paise,
            "features": plan.features
        }
        for plan in plans
    ]


@router.get("/tenants")
async def list_tenants(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN", "PLATFORM_ADMIN"))):
    q = await db.execute(select(Tenant))
    rows = q.scalars().all()
    tenants = []
    for t in rows:
        # Get subscription info
        sub_q = await db.execute(
            select(TenantSubscription, SubscriptionPlan)
            .join(SubscriptionPlan)
            .where(TenantSubscription.tenant_id == t.id, TenantSubscription.is_active == True)
        )
        sub = sub_q.first()
        plan_name = sub[1].name if sub else "None"
        tenants.append({
            "id": str(t.id),
            "name": t.name,
            "subdomain": t.subdomain,
            "status": t.status,
            "plan": plan_name,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return tenants


@router.post("/tenants")
async def onboard_tenant(request: OnboardTenantRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))):
    # Check if subdomain exists
    existing = await db.execute(select(Tenant).where(Tenant.subdomain == request.subdomain))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subdomain already exists")
    
    # Check if admin email already exists
    existing_user = await db.execute(select(User).where(User.email == request.admin_email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Admin email already exists")
    
    tenant = Tenant(
        name=request.name,
        subdomain=request.subdomain,
        status="active"
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    # Create tenant admin user
    admin_user = User(
        email=request.admin_email,
        full_name=request.admin_name,
        role=UserRole.TENANT_ADMIN,
        tenant_id=tenant.id,
        is_active=True
    )
    db.add(admin_user)
    
    # Assign subscription
    sub = TenantSubscription(
        tenant_id=tenant.id,
        plan_id=request.plan_id,
        start_date=datetime.date.today(),
        is_active=True
    )
    db.add(sub)
    
    # Create initial budget pool for the tenant (adapted to current BudgetPool model)
    # BudgetPool currently expects: tenant_id, period, total_amount, created_by
    budget_pool = BudgetPool(
        tenant_id=tenant.id,
        period="initial",
        total_amount=10000.00,
        created_by=user.id
    )
    db.add(budget_pool)
    
    await db.commit()
    
    # Log audit
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="TENANT_CREATED",
        target_tenant_id=tenant.id,
        details={
            "subdomain": request.subdomain,
            "plan_id": request.plan_id,
            "admin_email": request.admin_email,
            "admin_name": request.admin_name
        }
    )
    db.add(audit)
    await db.commit()
    
    return {
        "id": str(tenant.id),
        "subdomain": tenant.subdomain,
        "admin_email": request.admin_email,
        "status": "created"
    }


@router.post("/tenants/{tenant_id}/init-admin")
async def create_tenant_admin(tenant_id: str, request: CreateTenantAdminRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))):
    # Verify tenant exists
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_q.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if admin already exists for this tenant
    existing_admin_q = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.role == UserRole.TENANT_ADMIN)
    )
    if existing_admin_q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tenant admin already exists")
    
    # Create tenant admin user
    tenant_admin = User(
        tenant_id=tenant_id,
        email=request.email,
        full_name=request.full_name,
        role=UserRole.TENANT_ADMIN,
        is_active=True
    )
    db.add(tenant_admin)
    await db.commit()
    await db.refresh(tenant_admin)
    
    # Log audit
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="TENANT_ADMIN_CREATED",
        target_tenant_id=tenant_id,
        details={"admin_email": request.email, "admin_id": str(tenant_admin.id)}
    )
    db.add(audit)
    await db.commit()
    
    return {"id": str(tenant_admin.id), "email": tenant_admin.email, "role": tenant_admin.role.value}


@router.patch("/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, status: Optional[str] = None, subdomain: Optional[str] = None, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if status:
        t.status = status
    if subdomain:
        # Check uniqueness
        existing = await db.execute(select(Tenant).where(Tenant.subdomain == subdomain, Tenant.id != tenant_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Subdomain already exists")
        t.subdomain = subdomain
    
    db.add(t)
    await db.commit()
    
    # Log audit
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="TENANT_UPDATED",
        target_tenant_id=t.id,
        details={"status": status, "subdomain": subdomain}
    )
    db.add(audit)
    await db.commit()
    
    return {"id": tenant_id, "status": t.status, "subdomain": t.subdomain}


@router.get("/stats")
async def get_platform_stats(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    # Total tenants
    tenant_count = await db.execute(select(func.count(Tenant.id)))
    total_tenants = tenant_count.scalar()
    
    # Active tenants
    active_count = await db.execute(select(func.count(Tenant.id)).where(Tenant.status == "active"))
    active_tenants = active_count.scalar()
    
    # Total revenue (simplified - sum of active subscriptions)
    revenue_q = await db.execute(
        select(func.sum(SubscriptionPlan.monthly_price_in_paise))
        .join(TenantSubscription)
        .where(TenantSubscription.is_active == True)
    )
    total_revenue = revenue_q.scalar() or 0
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_revenue_paise": total_revenue
    }


@router.get("/overview")
async def get_platform_overview(request: Request, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))):
    # MRR (sum of active subscriptions)
    mrr_q = await db.execute(
        select(func.sum(SubscriptionPlan.monthly_price_in_paise))
        .join(TenantSubscription)
        .where(TenantSubscription.is_active == True)
    )
    mrr = mrr_q.scalar() or 0

    # Total active users (exclude platform admins)
    users_q = await db.execute(select(func.count(User.id)).where(User.is_active == True, User.tenant_id != None))
    total_active_users = users_q.scalar() or 0

    # System uptime (based on app start time recorded in app state)
    start_time = getattr(request.app.state, 'start_time', None)
    if start_time:
        uptime_seconds = int((datetime.datetime.utcnow() - start_time).total_seconds())
    else:
        uptime_seconds = 0

    # Top performing tenants by recognitions (last 30 days)
    since = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    rec_q = await db.execute(
        select(Tenant.id, Tenant.name, func.count(Recognition.id).label('rec_count'))
        .join(Recognition, Recognition.tenant_id == Tenant.id)
        .where(Recognition.created_at >= since)
        .group_by(Tenant.id)
        .order_by(desc('rec_count'))
        .limit(5)
    )
    top = [ { 'id': str(r[0]), 'name': r[1], 'recognitions': int(r[2]) } for r in rec_q.fetchall() ]

    return {
        'mrr_paise': mrr,
        'total_active_users': total_active_users,
        'uptime_seconds': uptime_seconds,
        'top_tenants': top
    }


@router.post("/rewards")
async def add_global_reward(request: GlobalRewardRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    reward = GlobalReward(
        title=request.title,
        provider=request.provider,
        points_cost=request.points_cost,
        is_enabled=True
    )
    db.add(reward)
    await db.commit()
    await db.refresh(reward)
    
    # Log audit
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="GLOBAL_REWARD_ADDED",
        details={"reward_id": str(reward.id), "title": request.title}
    )
    db.add(audit)
    await db.commit()
    
    return {"id": str(reward.id), "title": reward.title}


@router.get("/rewards")
async def list_global_rewards(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(GlobalReward))
    rewards = q.scalars().all()
    return [{"id": str(r.id), "title": r.title, "provider": r.provider, "points_cost": r.points_cost, "is_enabled": r.is_enabled} for r in rewards]


@router.post("/tenants/{tenant_id}/suspend")
async def suspend_tenant(tenant_id: str, reason: Optional[str] = None, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    t.suspended = True
    t.suspended_at = datetime.datetime.utcnow()
    t.suspended_reason = reason
    db.add(t)
    await db.commit()
    return {"tenant": tenant_id, "suspended": True}


@router.post("/tenants/{tenant_id}/unsuspend")
async def unsuspend_tenant(tenant_id: str, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    t.suspended = False
    t.suspended_at = None
    t.suspended_reason = None
    db.add(t)
    await db.commit()
    return {"tenant": tenant_id, "suspended": False}


@router.patch("/tenants/{tenant_id}/feature_flags")
async def update_feature_flags(tenant_id: str, payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    # merge flags at top-level
    flags = t.feature_flags or {}
    flags.update(payload)
    t.feature_flags = flags
    db.add(t)
    await db.commit()
    return {"tenant": tenant_id, "feature_flags": t.feature_flags}


@router.get("/platform/policies")
async def get_policies(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(PlatformSettings).where(PlatformSettings.id == 'global'))
    p = q.scalar_one_or_none()
    if not p:
        return {"policies": {}}
    return {"policies": p.policies}


@router.post("/platform/policies")
async def set_policies(payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(PlatformSettings).where(PlatformSettings.id == 'global'))
    p = q.scalar_one_or_none()
    if not p:
        p = PlatformSettings(id='global', policies=payload)
        db.add(p)
    else:
        p.policies = payload
        db.add(p)
    await db.commit()
    return {"policies": payload}


@router.post("/tenants/{tenant_id}/budgets")
async def create_budget_pool(tenant_id: str, payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    period = payload.get("period")
    total_amount = payload.get("total_amount")
    if not period or not total_amount:
        raise HTTPException(status_code=400, detail="period and total_amount required")
    
    pool = BudgetPool(
        tenant_id=tenant_id,
        period=period,
        total_amount=total_amount,
        created_by=user.id
    )
    db.add(pool)
    await db.commit()
    await db.refresh(pool)
    return {"id": pool.id, "period": pool.period, "total_amount": str(pool.total_amount)}