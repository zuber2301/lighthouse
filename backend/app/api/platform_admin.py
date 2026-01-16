from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.tenants import Tenant
from app.models.platform import PlatformSettings
from app.models.budgets import BudgetPool
from typing import Optional
import datetime
import uuid

router = APIRouter(prefix="/platform-admin")


@router.get("/status")
async def status():
    return {"status": "platform admin ok"}


@router.get("/tenants")
async def list_tenants(db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("SUPER_ADMIN"))):
    q = await db.execute(select(Tenant))
    rows = q.scalars().all()
    return rows


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