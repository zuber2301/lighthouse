from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, User as CurrentUser
from app.core.rbac import require_role
from app.db.session import get_db
from app.models.recognition import Recognition, RecognitionStatus
from app.models.users import User
from app.services.recognition_service import create_recognition, approve_recognition
from app.services.notification_service import send_recognition_email
from app.schemas.recognition import RecognitionCreate, RecognitionOut
from app.models.users import User
from app.models.transactions import Transaction, TransactionType
from app.models.points_ledger import PointsLedger
from app.models.budgets import TenantBudget
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


@router.post("/coach")
async def recognition_coach(payload: dict):
    """Simple heuristic-based recognition coach that returns tips and a suggested improved message.

    This is intentionally lightweight and runs locally; it can be replaced with an ML/LLM-backed
    implementation later.
    """
    msg = (payload.get('message') or '').strip()
    tips = []
    improved = msg

    if not msg:
        tips = [
            "Start with who and what — name the recipient and the action.",
            "Add a specific example so the recognition is concrete.",
            "Explain the impact of their action (what changed or improved).",
        ]
        improved = "[Recipient], thank you for ... Be specific about the action and its impact."
        return {"improved_message": improved, "tips": tips}

    # Basic heuristics
    if len(msg) < 40:
        tips.append('Add a concrete example to make this more specific.')
        improved = f"{msg} I especially noticed when you [describe a specific example], which helped because [describe impact]."

    vague_words = ['good', 'great', 'nice', 'awesome']
    if any(w in msg.lower() for w in vague_words):
        tips.append('Replace vague praise (e.g. "great") with a concrete example of what they did.')

    tips.append('Mention the impact of the action and why it mattered to the team or customer.')
    tips.append('Be timely: refer to when the action happened or the recent project.')

    return {"improved_message": improved, "tips": tips}


@router.get("/", response_model=List[RecognitionOut])
async def list_recognitions(
    request: Request,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    
    stmt = (
        select(Recognition)
        .where(Recognition.tenant_id == tenant)
    )
    
    if status_filter:
        stmt = stmt.where(Recognition.status == status_filter)
    elif user.role not in ["PLATFORM_OWNER", "TENANT_ADMIN"]:
        # Default to showing only approved on the public wall for Corporate Users
        stmt = stmt.where(Recognition.status == RecognitionStatus.APPROVED)

    stmt = stmt.order_by(Recognition.created_at.desc()).offset(offset).limit(limit).options(
        selectinload(Recognition.nominee),
        selectinload(Recognition.nominator)
    )
    res = await db.execute(stmt)
    recs = res.scalars().all()

    out = []
    for r in recs:
        out.append(
            {
                "id": r.id,
                "nominee_id": r.nominee_id,
                "nominee_name": r.nominee.full_name if r.nominee else "Unknown",
                "nominee_avatar": getattr(r.nominee, "avatar_url", None) if r.nominee else None,
                "nominee_department": getattr(r.nominee, "department", None) if r.nominee else None,
                "nominator_id": r.nominator_id,
                "nominator_name": r.nominator.full_name if r.nominator else "Unknown",
                "nominator_avatar": getattr(r.nominator, "avatar_url", None) if r.nominator else None,
                "points": r.points,
                "status": r.status.value if isinstance(r.status, RecognitionStatus) else str(r.status),
                "award_category": r.award_category.value if hasattr(r.award_category, "value") else str(r.award_category) if r.award_category else None,
                "high_five_count": r.high_five_count or 0,
                "badge_id": getattr(r, "badge_id", None),
                "value_tag": getattr(r, "value_tag", None),
                "ecard_url": getattr(r, "ecard_url", None),
                "area_of_focus": getattr(r, "area_of_focus", None),
                "media_url": getattr(r, "media_url", None),
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
    background_tasks: BackgroundTasks = None,
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

    # Fire-and-forget email notification to nominee (best-effort)
    try:
        # fetch nominee email
        stmt = select(User).where(User.id == str(rec.nominee_id))
        res = await db.execute(stmt)
        nominee = res.scalar_one_or_none()
        if nominee and getattr(nominee, 'email', None):
            subject = f"You received recognition from {getattr(user, 'full_name', getattr(user, 'email', 'Someone'))}"
            html = f"<p>{rec.message or ''}</p>"
            if getattr(rec, 'ecard_url', None):
                html += f'<p><a href="{rec.ecard_url}">View E-Card</a></p>'
            if background_tasks is not None:
                background_tasks.add_task(send_recognition_email, str(tenant), nominee.email, subject, html)
    except Exception:
        pass

    out = {
        "id": rec.id,
        "nominee_id": rec.nominee_id,
        "nominator_id": rec.nominator_id,
        "points": rec.points,
        "status": rec.status.value if isinstance(rec.status, RecognitionStatus) else str(rec.status),
        "award_category": rec.award_category.value if hasattr(rec.award_category, "value") else str(rec.award_category) if rec.award_category else None,
        "high_five_count": rec.high_five_count or 0,
        "badge_id": getattr(rec, "badge_id", None),
        "message": rec.message,
        "ecard_url": getattr(rec, "ecard_url", None),
        "area_of_focus": getattr(rec, "area_of_focus", None),
        "media_url": getattr(rec, "media_url", None),
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

    # Business Rule: Points based on Category
    points_map = {"GOLD": 500, "SILVER": 250, "BRONZE": 100, "ECARD": 0}
    award_category = getattr(payload, "award_category", "ECARD")
    if hasattr(award_category, "value"):
        award_category = award_category.value
    
    points = points_map.get(award_category, 0)

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

        # Update tenant-level budget consumed tracking (create if missing)
        tb_stmt = select(TenantBudget).where(TenantBudget.tenant_id == tenant)
        tb_res = await db.execute(tb_stmt)
        tb = tb_res.scalar_one_or_none()
        if not tb:
            tb = TenantBudget(tenant_id=tenant, total_loaded_paise=0, total_consumed_paise=points * 100)
            db.add(tb)
        else:
            tb.total_consumed_paise = int((tb.total_consumed_paise or 0) + (points * 100))
            db.add(tb)

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
        "award_category": rec.award_category.value if hasattr(rec.award_category, "value") else str(rec.award_category) if rec.award_category else None,
        "high_five_count": rec.high_five_count or 0,
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
                "ecard_url": getattr(r, "ecard_url", None),
                "area_of_focus": getattr(r, "area_of_focus", None),
                "media_url": getattr(r, "media_url", None),
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


@router.post("/{recognition_id}/high-five", status_code=200)
async def high_five_recognition(
    recognition_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    tenant = getattr(request.state, "tenant_id", None) or user.tenant_id
    
    stmt = select(Recognition).where(
        Recognition.id == str(recognition_id),
        Recognition.tenant_id == str(tenant)
    )
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Recognition not found")
    
    rec.high_five_count = (rec.high_five_count or 0) + 1
    await db.commit()
    await db.refresh(rec)
    
    return {"id": rec.id, "high_five_count": rec.high_five_count}
