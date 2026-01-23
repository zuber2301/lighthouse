from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound
from app.models import Recognition, User, Badge
from app.models.points_ledger import PointsLedger
from app.models.budgets import DepartmentBudget, BudgetLedger
from uuid import UUID
from app.models.recognition import RecognitionStatus
from sqlalchemy import select, func
import os
from uuid import uuid4


async def create_recognition(db: AsyncSession, tenant_id: str, nominator_id: str, payload) -> Recognition:
    # validate nominee exists and belongs to tenant
    # User.id is stored as string; ensure we compare against a string to avoid
    # Postgres type mismatch when payload.nominee_id is a UUID object.
    res = await db.execute(select(User).where(User.id == str(payload.nominee_id)))
    nominee = res.scalar_one_or_none()
    if not nominee or str(nominee.tenant_id) != str(tenant_id):
        raise ValueError("Nominee not found or tenant mismatch")

    # business rule: auto-approve roles handled at API layer if desired
    rec = Recognition(
        tenant_id=tenant_id,
        nominator_id=nominator_id,
        nominee_id=str(payload.nominee_id),
        value_tag=payload.value_tag,
        points=payload.points,
        message=payload.message,
        is_public=bool(getattr(payload, "is_public", True)),
        points_awarded=payload.points,
        status=RecognitionStatus.PENDING,
    )

    # If an ecard_html payload is provided, persist it as an HTML file under uploads and
    # set rec.ecard_url to the resulting path so it is served permanently.
    try:
        ecard_html = getattr(payload, 'ecard_html', None)
        ecard_url = getattr(payload, 'ecard_url', None)
        media_url = getattr(payload, 'media_url', None)
        area_of_focus = getattr(payload, 'area_of_focus', None)
        if ecard_html:
            # Sanitize incoming HTML to reduce XSS risk before saving
            try:
                import bleach
                allowed_tags = [
                    'a', 'b', 'i', 'u', 'em', 'strong', 'div', 'span', 'img', 'p', 'br'
                ]
                allowed_attrs = {
                    '*': ['style'],
                    'a': ['href', 'target', 'rel'],
                    'img': ['src', 'alt', 'style']
                }
                safe_html = bleach.clean(ecard_html, tags=allowed_tags, attributes=allowed_attrs, strip=True)
            except Exception:
                # If bleach not available or fails, fall back to original
                safe_html = ecard_html

            upload_dir = os.path.join(os.getcwd(), 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            fname = f"ecard-{uuid4().hex}.html"
            path = os.path.join(upload_dir, fname)
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(safe_html)
            rec.ecard_url = f"/uploads/{fname}"
        elif ecard_url:
            # If an upload URL (image/pdf) was provided by client, store it directly
            rec.ecard_url = str(ecard_url)
        # store media_url and area_of_focus if provided
        if media_url:
            rec.media_url = str(media_url)
        if area_of_focus:
            rec.area_of_focus = str(area_of_focus)
    except Exception:
        # Fail-safe: do not block recognition creation if ecard persistence or sanitization fails
        pass

    # validate badge if provided
    if getattr(payload, "badge_id", None):
        badge_res = await db.execute(select(Badge).where(Badge.id == str(payload.badge_id)))
        badge = badge_res.scalar_one_or_none()
        if not badge:
            raise ValueError("Badge not found")
        if badge.tenant_id and str(badge.tenant_id) != str(tenant_id):
            raise ValueError("Badge tenant mismatch")
        rec.badge_id = str(payload.badge_id)

    db.add(rec)
    await db.flush()
    return rec


async def approve_recognition(db: AsyncSession, tenant_id: str, recognition_id: UUID, approver_id: str):
    # lock the recognition row to prevent double-approval
    stmt = select(Recognition).where(
        Recognition.id == str(recognition_id),
        Recognition.tenant_id == str(tenant_id),
        Recognition.status == RecognitionStatus.PENDING,
    ).with_for_update()

    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        raise NoResultFound("Recognition not found or already processed")

    # Get approver's department
    approver_stmt = select(User).where(User.id == str(approver_id), User.tenant_id == str(tenant_id))
    approver_res = await db.execute(approver_stmt)
    approver = approver_res.scalar_one_or_none()
    if not approver or not approver.department:
        raise ValueError("Approver not found or no department")

    department = approver.department

    # Check budget
    budget_stmt = select(DepartmentBudget).where(
        DepartmentBudget.tenant_id == tenant_id,
        DepartmentBudget.department_id == department
    ).with_for_update()
    budget_res = await db.execute(budget_stmt)
    budget = budget_res.scalar_one_or_none()
    if not budget:
        raise ValueError("No budget allocated for department")

    if budget.used_amount + rec.points > budget.allocated_amount:
        raise ValueError("Insufficient budget")

    rec.status = RecognitionStatus.APPROVED

    # Update budget
    budget.used_amount += rec.points

    ledger = PointsLedger(
        tenant_id=tenant_id,
        user_id=rec.nominee_id,
        delta=rec.points,
        reason="RECOGNITION_APPROVED",
        reference_id=rec.id,
    )
    db.add(ledger)

    # Budget ledger
    budget_ledger = BudgetLedger(
        tenant_id=tenant_id,
        department_id=department,
        delta_amount=-rec.points,  # negative for usage
        reason="RECOGNITION",
        reference_id=rec.id,
    )
    db.add(budget_ledger)

    await db.flush()
    return rec
