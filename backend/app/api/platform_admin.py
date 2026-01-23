from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.budgets import TenantBudget
from app.models.users import User, UserRole
from app.models.platform import PlatformSettings
from app.models.budgets import BudgetPool
from app.models.budget_load_logs import BudgetLoadLog
from app.models.subscriptions import SubscriptionPlan, TenantSubscription
from app.models.global_rewards import GlobalReward
from app.models.global_providers import GlobalProvider
from app.models.audit_logs import PlatformAuditLog
from app.models.transactions import Transaction, TransactionType
from app.models.recognition import Recognition
from app.models.budget_load_logs import BudgetLoadLog
from app.models.budgets import TenantBudget
from typing import Optional, List
import datetime
import uuid
from pydantic import BaseModel
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import desc


class OnboardTenantRequest(BaseModel):
    name: str
    subdomain: str
    admin_email: str
    admin_name: str
    plan_id: Optional[int] = None
    industry: Optional[str] = None
    credit_limit: Optional[int] = 0


class CreateTenantAdminRequest(BaseModel):
    tenant_id: str
    email: str
    full_name: str


class GlobalRewardRequest(BaseModel):
    title: str
    provider: Optional[str] = None
    points_cost: int


class LoadBudgetRequest(BaseModel):
    tenant_id: str
    amount: Decimal


class AdminLeadsResponse(BaseModel):
    id: str
    full_name: str
    email: str
    lead_budget_balance: int


class AdminAllocateRequest(BaseModel):
    tenant_id: str
    lead_id: str
    amount: Decimal

router = APIRouter(prefix="/platform")


@router.get("/subscription-plans")
async def get_subscription_plans(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    result = await db.execute(select(SubscriptionPlan))
    plans = result.scalars().all()
    
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "monthly_price": plan.monthly_price_in_paise / 100,  # Add monthly_price for tests
            "monthly_price_in_paise": plan.monthly_price_in_paise,
            "features": plan.features
        }
        for plan in plans
    ]


@router.get("/tenants")
async def list_tenants(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN", "PLATFORM_OWNER"))):
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
        # user count
        user_q = await db.execute(select(func.count(User.id)).where(User.tenant_id == t.id, User.is_active == True))
        user_count = user_q.scalar() or 0

        # last 7 days activity (recognitions per day)
        today = datetime.datetime.utcnow().date()
        dates = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]
        activity = []
        for d in dates:
            start = datetime.datetime.combine(d, datetime.time.min)
            end = datetime.datetime.combine(d, datetime.time.max)
            a_q = await db.execute(select(func.count(Recognition.id)).where(Recognition.tenant_id == t.id, Recognition.created_at >= start, Recognition.created_at <= end))
            activity.append(int(a_q.scalar() or 0))

        tenants.append({
            "id": str(t.id),
            "name": t.name,
            "subdomain": t.subdomain,
            "status": t.status,
            "plan": plan_name,
            "user_count": int(user_count),
            "last_billing_date": t.last_billing_date.isoformat() if getattr(t, 'last_billing_date', None) else None,
            "credit_limit": int(getattr(t, 'credit_limit', 0) or 0),
            "activity_last_7_days": activity,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "master_budget_balance_paise": int(getattr(t, 'master_budget_balance', 0) or 0),
            "master_budget_balance": float((Decimal(int(getattr(t, 'master_budget_balance', 0) or 0)) / Decimal(100)).quantize(Decimal('0.01')))
        })
        # attach tenant budget totals if available
        tb_q = await db.execute(select(TenantBudget).where(TenantBudget.tenant_id == t.id))
        tb = tb_q.scalar_one_or_none()
        if tb:
            tenants[-1]["budget_allocated_paise"] = int(tb.total_loaded_paise or 0)
            tenants[-1]["budget_consumed_paise"] = int(tb.total_consumed_paise or 0)
            # frontend expects `budget_allocated`/`budget_consumed` as paise integers
            tenants[-1]["budget_allocated"] = int(tb.total_loaded_paise or 0)
            tenants[-1]["budget_consumed"] = int(tb.total_consumed_paise or 0)
        else:
            tenants[-1]["budget_allocated_paise"] = 0
            tenants[-1]["budget_consumed_paise"] = 0
            tenants[-1]["budget_allocated"] = 0
            tenants[-1]["budget_consumed"] = 0
    return tenants


@router.post("/tenants")
async def onboard_tenant(request: OnboardTenantRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
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
        status="active",
        industry=request.industry,
        credit_limit=request.credit_limit or 0,
        last_billing_date=datetime.date.today()
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
    
    # Assign subscription: if plan_id not provided, assign Basic plan
    plan_id = request.plan_id
    if not plan_id:
        plan_q = await db.execute(select(SubscriptionPlan).where(func.lower(SubscriptionPlan.name) == 'basic'))
        plan = plan_q.scalar_one_or_none()
        if not plan:
            # fallback to first available plan
            plan_q2 = await db.execute(select(SubscriptionPlan).limit(1))
            plan = plan_q2.scalar_one_or_none()
        plan_id = plan.id if plan else None

    if plan_id:
        sub = TenantSubscription(
            tenant_id=tenant.id,
            plan_id=plan_id,
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
    
    # Log audit for tenant creation
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="TENANT_CREATED",
        target_tenant_id=tenant.id,
        details={
            "subdomain": request.subdomain,
            "plan_id": plan_id,
            "admin_email": request.admin_email,
            "admin_name": request.admin_name,
            "industry": request.industry,
            "credit_limit": request.credit_limit
        }
    )
    db.add(audit)
    await db.commit()

    # Simulate sending welcome email by creating an audit log entry (email delivery integration can replace this)
    email_audit = PlatformAuditLog(
        admin_id=user.id,
        action="WELCOME_EMAIL_SENT",
        target_tenant_id=tenant.id,
        details={
            "to": request.admin_email,
            "subject": "Welcome to LightHouse - Set your password",
        }
    )
    db.add(email_audit)
    await db.commit()
    
    return {
        "id": str(tenant.id),
        "subdomain": tenant.subdomain,
        "admin_email": request.admin_email,
        "admin_user_id": str(admin_user.id),
        "status": "created",
        "message": "Tenant onboarded successfully"
    }


@router.post("/create-tenant-admin")
async def create_tenant_admin(request: CreateTenantAdminRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER"))):
    tenant_id = request.tenant_id
    # Verify tenant exists
    tenant_q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_q.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if admin already exists for this email
    existing_user_q = await db.execute(
        select(User).where(User.email == request.email)
    )
    if existing_user_q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
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
    
    return {
        "user_id": str(tenant_admin.id),
        "email": tenant_admin.email,
        "role": tenant_admin.role.value,
        "message": "Tenant admin created successfully"
    }


@router.get("/tenant-stats")
async def get_tenant_stats(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    # Total tenants
    tenant_count_q = await db.execute(select(func.count(Tenant.id)))
    total_tenants = tenant_count_q.scalar() or 0
    
    # Active tenants
    active_count_q = await db.execute(select(func.count(Tenant.id)).where(Tenant.status == "active"))
    active_tenants = active_count_q.scalar() or 0
    
    # Total users
    user_count_q = await db.execute(select(func.count(User.id)))
    total_users = user_count_q.scalar() or 0
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_users": total_users
    }


@router.get("/stats")
async def get_platform_stats(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN", "PLATFORM_OWNER"))):
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
    # total master budget across tenants (stored as paise/int)
    mb_q = await db.execute(select(func.sum(Tenant.master_budget_balance)))
    total_master_budget = mb_q.scalar() or 0
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_revenue_paise": total_revenue,
        "total_master_budget_paise": int(total_master_budget or 0)
    }


@router.get("/overview")
async def get_platform_overview(request: Request, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
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
        'INR': mrr,
        'total_active_users': total_active_users,
        'uptime_seconds': uptime_seconds,
        'top_tenants': top
    }


@router.post('/recalculate-budgets')
async def recalculate_budgets(tenant_id: Optional[str] = None, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    """Recalculate tenant budget totals from historical BudgetLoadLog and Transaction records.

    If `tenant_id` is provided, only that tenant is recalculated. Otherwise all tenants are processed.
    This updates/creates `TenantBudget` records with `total_loaded_paise` and `total_consumed_paise`.
    """
    # Collect tenants to process
    if tenant_id:
        q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenants = [q.scalar_one_or_none()] if q.scalar_one_or_none() else []
    else:
        q = await db.execute(select(Tenant))
        tenants = q.scalars().all()

    results = []
    for t in tenants:
        if not t:
            continue
        # Sum budget loads (BudgetLoadLog.amount is stored in currency units e.g. INR)
        bl_q = await db.execute(select(func.coalesce(func.sum(BudgetLoadLog.amount), 0)).where(BudgetLoadLog.tenant_id == t.id))
        total_loaded_rupees = bl_q.scalar() or 0
        # convert to paise (integer)
        try:
            loaded_paise = int(Decimal(total_loaded_rupees) * Decimal(100))
        except Exception:
            loaded_paise = int(float(total_loaded_rupees) * 100)

        # Sum consumed transactions: ALLOCATE and RECOGNITION reduce master budget
        tx_q = await db.execute(select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.tenant_id == t.id, Transaction.type.in_([TransactionType.ALLOCATE, TransactionType.RECOGNITION])))
        consumed_paise = int(tx_q.scalar() or 0)

        # Upsert TenantBudget
        tb_q = await db.execute(select(TenantBudget).where(TenantBudget.tenant_id == t.id))
        tb = tb_q.scalar_one_or_none()
        if not tb:
            tb = TenantBudget(tenant_id=t.id, total_loaded_paise=loaded_paise, total_consumed_paise=consumed_paise)
            db.add(tb)
        else:
            tb.total_loaded_paise = int(loaded_paise)
            tb.total_consumed_paise = int(consumed_paise)
            db.add(tb)

        results.append({
            "tenant_id": str(t.id),
            "name": t.name,
            "loaded_paise": int(loaded_paise),
            "consumed_paise": int(consumed_paise),
        })

    await db.commit()
    return {"updated": len(results), "items": results}


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


@router.get("/catalog")
async def get_platform_catalog(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    q = await db.execute(select(GlobalProvider))
    providers = q.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "enabled": bool(p.enabled),
            "min_plan": p.min_plan,
            "margin_paise": int(p.margin_paise or 0)
        }
        for p in providers
    ]


@router.patch("/catalog/{provider_id}")
async def update_provider(provider_id: str, payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    q = await db.execute(select(GlobalProvider).where(GlobalProvider.id == provider_id))
    p = q.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    # allow updating enabled, min_plan, margin_paise
    if 'enabled' in payload:
        p.enabled = bool(payload['enabled'])
    if 'min_plan' in payload:
        p.min_plan = payload.get('min_plan')
    if 'margin_paise' in payload:
        try:
            p.margin_paise = int(payload.get('margin_paise') or 0)
        except Exception:
            p.margin_paise = 0
    db.add(p)
    await db.commit()
    await db.refresh(p)
    # audit
    audit = PlatformAuditLog(
        admin_id=user.id,
        action="PROVIDER_UPDATED",
        details={"provider_id": p.id, "changes": payload}
    )
    db.add(audit)
    await db.commit()
    return {"id": p.id, "name": p.name, "enabled": p.enabled, "min_plan": p.min_plan, "margin_paise": p.margin_paise}


@router.get("/rewards")
async def list_global_rewards(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(GlobalReward))
    rewards = q.scalars().all()
    return [{"id": str(r.id), "title": r.title, "provider": r.provider, "points_cost": r.points_cost, "is_enabled": r.is_enabled} for r in rewards]


@router.post("/tenants/{tenant_id}/suspend")
async def suspend_tenant(tenant_id: str, reason: Optional[str] = None, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    t.suspended = True
    t.status = 'suspended'
    t.suspended_at = datetime.datetime.utcnow()
    t.suspended_reason = reason
    db.add(t)
    await db.commit()
    return {"tenant": tenant_id, "suspended": True}


@router.post("/tenants/{tenant_id}/unsuspend")
async def unsuspend_tenant(tenant_id: str, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    t.suspended = False
    t.status = 'active'
    t.suspended_at = None
    t.suspended_reason = None
    db.add(t)
    await db.commit()
    return {"tenant": tenant_id, "suspended": False}


@router.patch("/tenants/{tenant_id}/feature_flags")
async def update_feature_flags(tenant_id: str, payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
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
async def get_policies(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
    q = await db.execute(select(PlatformSettings).where(PlatformSettings.id == 'global'))
    p = q.scalar_one_or_none()
    if not p:
        return {"policies": {}}
    return {"policies": p.policies}


@router.post("/platform/policies")
async def set_policies(payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER", "SUPER_ADMIN"))):
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



@router.post("/load-budget")
async def load_master_budget(request: LoadBudgetRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_OWNER"))):
    """Platform Owner deposits funds into a Tenant's master wallet.

    `amount` is expected in currency units (e.g. INR). The tenant.master_budget_balance
    is stored as integer paise (BigInteger) in the DB, so we convert amount to paise before updating.
    """
    # verify tenant exists
    q = await db.execute(select(Tenant).where(Tenant.id == request.tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # normalize amount and convert to paise (integer)
    try:
        amt = Decimal(request.amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount")

    paise = int((amt * Decimal(100)).to_integral_value(rounding=ROUND_HALF_UP))

    # perform update and insert log; commit using the provided session (avoid nested transactions)
    current = int(getattr(t, 'master_budget_balance', 0) or 0)
    t.master_budget_balance = current + paise
    db.add(t)

    log = BudgetLoadLog(
        platform_owner_id=user.id,
        tenant_id=t.id,
        amount=amt,
        transaction_type='DEPOSIT'
    )
    db.add(log)
    await db.commit()
    await db.refresh(t)

    # return updated balances (both paise and currency)
    return {
        "tenant_id": str(t.id),
        "master_budget_balance_paise": int(t.master_budget_balance),
        "master_budget_balance": float((Decimal(int(t.master_budget_balance)) / Decimal(100)).quantize(Decimal('0.01'))),
        "loaded_amount": float(amt)
    }



@router.get('/admin/tenants/{tenant_id}/leads')
async def list_tenant_leads(tenant_id: str, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN", "PLATFORM_OWNER", "SUPER_ADMIN"))):
    """Return all Tenant Leads for a tenant. Tenant Admins can only query their own tenant."""
    # If caller is a tenant admin, ensure they can only access their tenant
    if getattr(user, 'role', None) and getattr(user.role, 'value', None) == 'TENANT_ADMIN':
        if str(user.tenant_id) != str(tenant_id):
            raise HTTPException(status_code=403, detail="Forbidden")

    q = await db.execute(select(User).where(User.tenant_id == tenant_id, User.role == UserRole.TENANT_LEAD))
    leads = q.scalars().all()
    return [
        {
            "id": str(l.id),
            "full_name": l.full_name,
            "email": l.email,
            "lead_budget_balance": int(l.lead_budget_balance or 0)
        }
        for l in leads
    ]


@router.post('/admin/allocate-to-lead')
async def admin_allocate_to_lead(req: AdminAllocateRequest, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN", "PLATFORM_OWNER", "SUPER_ADMIN"))):
    """Allocate funds from a tenant's master pool to a lead's budget.

    Amount is provided in currency units (e.g. INR) and converted to paise internally.
    """
    # If caller is a tenant admin, ensure they operate only on their tenant
    if getattr(user, 'role', None) and getattr(user.role, 'value', None) == 'TENANT_ADMIN':
        if str(user.tenant_id) != str(req.tenant_id):
            raise HTTPException(status_code=403, detail="Forbidden")

    # verify tenant exists
    t_q = await db.execute(select(Tenant).where(Tenant.id == req.tenant_id))
    tenant = t_q.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # verify lead exists and belongs to tenant
    lead_q = await db.execute(select(User).where(User.id == req.lead_id, User.tenant_id == req.tenant_id, User.role == UserRole.TENANT_LEAD))
    lead = lead_q.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # normalize amount
    try:
        amt = Decimal(req.amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount")

    paise = int((amt * Decimal(100)).to_integral_value(rounding=ROUND_HALF_UP))

    # check master balance
    current_master = int(getattr(tenant, 'master_budget_balance', 0) or 0)
    if current_master < paise:
        raise HTTPException(status_code=400, detail="Insufficient master budget")

    # perform transfer
    tenant.master_budget_balance = current_master - paise
    lead.lead_budget_balance = int((lead.lead_budget_balance or 0) + paise)
    db.add(tenant)
    db.add(lead)

    # write budget load log and platform audit for history of allocation
    log = BudgetLoadLog(
        platform_owner_id=user.id,
        tenant_id=tenant.id,
        amount=amt,
        transaction_type='ALLOCATE_TO_LEAD'
    )
    db.add(log)

    audit = PlatformAuditLog(
        admin_id=user.id,
        action='ALLOCATE_TO_LEAD',
        target_tenant_id=tenant.id,
        details={"lead_id": str(lead.id), "amount": float(amt), "master_before_paise": current_master}
    )
    db.add(audit)

    await db.commit()

    return {
        "tenant_id": str(tenant.id),
        "master_budget_balance_paise": int(tenant.master_budget_balance),
        "master_budget_balance": float((Decimal(int(tenant.master_budget_balance)) / Decimal(100)).quantize(Decimal('0.01'))),
        "lead_id": str(lead.id),
        "lead_budget_balance_paise": int(lead.lead_budget_balance),
        "lead_budget_balance": float((Decimal(int(lead.lead_budget_balance)) / Decimal(100)).quantize(Decimal('0.01')))
    }


@router.get('/logs')
async def list_platform_logs(
    limit: int = 50,
    offset: int = 0,
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    target_tenant_id: Optional[str] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))
):
    """Return audit logs for platform admins. Paginated. Includes admin user details when available.

    Supports optional filters: `action`, `admin_id`, `target_tenant_id`, `start_date`, `end_date`.
    """
    filters = []
    if action:
        filters.append(PlatformAuditLog.action == action)
    if admin_id:
        filters.append(PlatformAuditLog.admin_id == admin_id)
    if target_tenant_id:
        filters.append(PlatformAuditLog.target_tenant_id == target_tenant_id)
    if start_date:
        start_dt = datetime.datetime.combine(start_date, datetime.time.min)
        filters.append(PlatformAuditLog.created_at >= start_dt)
    if end_date:
        end_dt = datetime.datetime.combine(end_date, datetime.time.max)
        filters.append(PlatformAuditLog.created_at <= end_dt)

    stmt = select(PlatformAuditLog, User).outerjoin(User, User.id == PlatformAuditLog.admin_id)
    if filters:
        stmt = stmt.where(*filters)
    stmt = stmt.order_by(PlatformAuditLog.created_at.desc()).limit(limit).offset(offset)

    q = await db.execute(stmt)
    rows = q.all()
    result = []
    for row in rows:
        r = row[0]
        admin = row[1]
        result.append({
            "id": r.id,
            "admin": {
                "id": str(admin.id) if admin else None,
                "full_name": admin.full_name if admin else None,
                "email": admin.email if admin else None,
                "role": admin.role.value if admin and hasattr(admin, 'role') and hasattr(admin.role, 'value') else (admin.role if admin else None)
            },
            "action": r.action,
            "target_tenant_id": r.target_tenant_id,
            "details": r.details,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.get('/logs/{log_id}')
async def get_platform_log(log_id: int, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("PLATFORM_ADMIN"))):
    stmt = select(PlatformAuditLog, User).outerjoin(User, User.id == PlatformAuditLog.admin_id).where(PlatformAuditLog.id == log_id)
    q = await db.execute(stmt)
    row = q.first()
    if not row:
        raise HTTPException(status_code=404, detail='Log not found')
    r = row[0]
    admin = row[1]
    return {
        "id": r.id,
        "admin": {
            "id": str(admin.id) if admin else None,
            "full_name": admin.full_name if admin else None,
            "email": admin.email if admin else None,
            "role": admin.role.value if admin and hasattr(admin, 'role') and hasattr(admin.role, 'value') else (admin.role if admin else None)
        },
        "action": r.action,
        "target_tenant_id": r.target_tenant_id,
        "details": r.details,
        "created_at": r.created_at.isoformat() if r.created_at else None
    }