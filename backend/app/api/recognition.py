from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, User as CurrentUser
from app.core.rbac import require_role
from app.db.session import get_db
from app.models.recognition import Recognition, RecognitionStatus
from app.models.users import User
from app.services.recognition_service import create_recognition, approve_recognition
from app.schemas.recognition import RecognitionCreate, RecognitionOut


router = APIRouter(prefix="/recognition")


@router.get("/", response_model=List[RecognitionOut])
async def list_recognitions(
    request: Request,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    tenant = getattr(request.state, "tenant_id", None)
    stmt = (
        select(Recognition)
        .where(Recognition.tenant_id == tenant)
        .order_by(Recognition.created_at.desc())
        .offset(offset)
        .limit(limit)
        .options(selectinload(Recognition.nominee))
    )
    res = await db.execute(stmt)
    recs = res.scalars().all()

    out = []
    for r in recs:
        out.append(
            {
                "id": r.id,
                "nominee_id": r.nominee_id,
                "points": r.points,
                "status": r.status.value if isinstance(r.status, RecognitionStatus) else str(r.status),
            }
        )

    return out


@router.post("/", response_model=RecognitionOut, status_code=201)
async def create_recognition_endpoint(
    payload: RecognitionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    if str(user.tenant_id) != str(tenant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant mismatch")

    try:
        rec = await create_recognition(db=db, tenant_id=tenant, nominator_id=user.id, payload=payload)
        await db.commit()
        await db.refresh(rec)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return rec


@router.post("/{rec_id}/approve")
async def approve_recognition_endpoint(
    rec_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("MANAGER", "TENANT_ADMIN", "SUPER_ADMIN")),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id

    try:
        rec = await approve_recognition(db=db, tenant_id=tenant, recognition_id=rec_id, approver_id=user.id)
        await db.commit()
        await db.refresh(rec)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"id": rec.id, "status": rec.status.value}
