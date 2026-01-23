from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.auth import get_current_user, User as CurrentUser
from app.core.rbac import require_role
from app.models import Badge
from app.schemas.badge import BadgeCreate, BadgeOut, BadgeUpdate


router = APIRouter(prefix="/badges")


@router.get("/", response_model=List[BadgeOut])
async def list_badges(
    request: Request,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    tenant = getattr(request.state, "tenant_id", None)
    # return global (tenant_id is NULL) and tenant-specific badges
    stmt = select(Badge).where((Badge.tenant_id == None) | (Badge.tenant_id == tenant)).offset(offset).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return items


@router.post("/", response_model=BadgeOut, status_code=201)
async def create_badge(
    payload: BadgeCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    # tenant admins create tenant-scoped badges; SUPER_ADMIN may create global badges by setting tenant to None
    badge = Badge(
        tenant_id=tenant,
        name=payload.name,
        icon_url=payload.icon_url,
        points_value=payload.points_value,
        category=payload.category,
    )
    db.add(badge)
    try:
        await db.commit()
        await db.refresh(badge)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return badge


@router.get("/{badge_id}", response_model=BadgeOut)
async def get_badge(badge_id: UUID, request: Request, db: AsyncSession = Depends(get_db)):
    tenant = getattr(request.state, "tenant_id", None)
    stmt = select(Badge).where(Badge.id == str(badge_id))
    res = await db.execute(stmt)
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Badge not found")
    # ensure visibility
    if b.tenant_id and str(b.tenant_id) != str(tenant):
        raise HTTPException(status_code=403, detail="Forbidden")
    return b


@router.patch("/{badge_id}", response_model=BadgeOut)
async def update_badge(
    badge_id: UUID,
    payload: BadgeUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    stmt = select(Badge).where(Badge.id == str(badge_id))
    res = await db.execute(stmt)
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Badge not found")
    # only super_admin can modify global badges
    if b.tenant_id is None and user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    if b.tenant_id and str(b.tenant_id) != str(tenant):
        raise HTTPException(status_code=403, detail="Forbidden")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(b, k, v)

    try:
        await db.commit()
        await db.refresh(b)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return b


@router.delete("/{badge_id}", status_code=204)
async def delete_badge(
    badge_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("TENANT_ADMIN", "SUPER_ADMIN")),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    stmt = select(Badge).where(Badge.id == str(badge_id))
    res = await db.execute(stmt)
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Badge not found")
    if b.tenant_id is None and user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")
    if b.tenant_id and str(b.tenant_id) != str(tenant):
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.delete(b)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Delete failed")

    return None
