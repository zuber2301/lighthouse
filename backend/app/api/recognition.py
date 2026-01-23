from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File
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
from app.models.users import User
from app.models.transactions import Transaction, TransactionType
from app.models.points_ledger import PointsLedger
from app.core.redis_client import get_social_feed, push_social_feed
import datetime


router = APIRouter(prefix="/recognition")


@router.post("/uploads")
async def upload_files(files: List[UploadFile] = File(...)):
    """Accept multiple files and save them to the backend `uploads/` folder.

    Returns a list of uploaded file metadata with URLs.
    """
    import os
    from uuid import uuid4

    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    out = []
    for f in files:
        try:
            contents = await f.read()
            ext = os.path.splitext(f.filename)[1]
            fname = f"{uuid4().hex}{ext}"
            path = os.path.join(upload_dir, fname)
            with open(path, "wb") as fh:
                fh.write(contents)
            url = f"/uploads/{fname}"
            out.append({"name": f.filename, "url": url, "type": f.content_type})
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to save file: {f.filename}") from exc

    return out


@router.get("/", response_model=List[RecognitionOut])
async def list_recognitions(
    request: Request,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
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
                "badge_id": getattr(r, "badge_id", None),
                "value_tag": getattr(r, "value_tag", None),
                "message": r.message,
                "is_public": getattr(r, "is_public", True),
                "created_at": r.created_at.isoformat() if getattr(r, "created_at", None) else None,
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

    out = {
        "id": rec.id,
        "nominee_id": rec.nominee_id,
        "points": rec.points,
        "status": rec.status.value if isinstance(rec.status, RecognitionStatus) else str(rec.status),
        "badge_id": getattr(rec, "badge_id", None),
        "message": rec.message,
        "is_public": getattr(rec, "is_public", True),
        "created_at": rec.created_at.isoformat() if getattr(rec, "created_at", None) else None,
    }

    return out

@router.post("/give-check", status_code=201)
async def give_check(
    payload: RecognitionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Immediate recognition flow where a TENANT_LEAD can give points from their lead_budget_balance.

    This deducts from the nominator's lead_budget_balance, credits nominee points_balance,
    creates a Recognition record (auto-approved), a Transaction and PointsLedger entry.
    """
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    if str(user.tenant_id) != str(tenant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant mismatch")

    # Only allow tenant leads (and super admins)
    if user.role not in ("TENANT_LEAD", "SUPER_ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")

    # Reload nominator from DB to get latest balances
    nom_stmt = select(User).where(User.id == user.id)
    nom_res = await db.execute(nom_stmt)
    nominator = nom_res.scalar_one_or_none()
    if not nominator:
        raise HTTPException(status_code=400, detail="Nominator not found")

    points = int(payload.points)
    if user.role == "TENANT_LEAD":
        if (nominator.lead_budget_balance or 0) < points:
            raise HTTPException(status_code=400, detail="Insufficient lead budget")

    # validate nominee
    res = await db.execute(select(User).where(User.id == str(payload.nominee_id)))
    nominee = res.scalar_one_or_none()
    if not nominee or str(nominee.tenant_id) != str(tenant):
        raise HTTPException(status_code=400, detail="Nominee not found or tenant mismatch")

    # create recognition (auto-approved)
    rec = None
    try:
        rec = await create_recognition(db=db, tenant_id=tenant, nominator_id=user.id, payload=payload)
        rec.status = rec.status.APPROVED if hasattr(rec.status, "APPROVED") else rec.status

        # adjust balances and create transaction/ledger
        if user.role == "TENANT_LEAD":
            nominator.lead_budget_balance -= points
        nominee.points_balance = (nominee.points_balance or 0) + points

        # transaction amount in paise
        tx = Transaction(
            tenant_id=tenant,
            sender_id=user.id,
            receiver_id=nominee.id,
            amount=points * 100,
            type=TransactionType.RECOGNITION,
            note=payload.message,
        )
        db.add(tx)

        ledger = PointsLedger(
            tenant_id=tenant,
            user_id=nominee.id,
            delta=points,
            reason="GIVE_CHECK",
            reference_id=rec.id,
        )
        db.add(ledger)

        await db.commit()
        await db.refresh(rec)

        # push to social feed (best-effort)
        try:
            item = f"{nominee.full_name} received {points} points from {nominator.full_name}"
            await push_social_feed(str(tenant), item)
        except Exception:
            pass

    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    out = {
        "id": rec.id,
        "nominee_id": rec.nominee_id,
        "points": rec.points,
        "status": rec.status.value if hasattr(rec.status, "value") else str(rec.status),
        "badge_id": getattr(rec, "badge_id", None),
        "message": rec.message,
        "is_public": getattr(rec, "is_public", True),
        "created_at": rec.created_at.isoformat() if getattr(rec, "created_at", None) else None,
    }
    return out


@router.get("/feed")
async def recognition_feed(request: Request, limit: int = 50, db: AsyncSession = Depends(get_db)):
    tenant = getattr(request.state, "tenant_id", None)
    # Try Redis-backed feed first
    try:
        items = await get_social_feed(str(tenant), limit=limit)
        return {"feed": items}
    except Exception:
        # Fallback to DB query
        stmt = (
            select(Recognition)
            .where(Recognition.tenant_id == tenant)
            .order_by(Recognition.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        recs = res.scalars().all()
        out = [
            {
                "id": r.id,
                "nominee_id": r.nominee_id,
                "points": r.points,
                "message": r.message,
                "is_public": getattr(r, "is_public", True),
                "created_at": r.created_at.isoformat() if getattr(r, "created_at", None) else None,
            }
            for r in recs
        ]
        return {"feed": out}


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
