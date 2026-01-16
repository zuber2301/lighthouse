from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound
from app.models import Recognition, User
from app.models.points_ledger import PointsLedger
from app.models.budgets import DepartmentBudget, BudgetLedger
from uuid import UUID
from app.models.recognition import RecognitionStatus
from sqlalchemy import select, func


async def create_recognition(db: AsyncSession, tenant_id: str, nominator_id: str, payload) -> Recognition:
    # validate nominee exists and belongs to tenant
    res = await db.execute(select(User).where(User.id == payload.nominee_id))
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
        status=RecognitionStatus.PENDING,
    )
    db.add(rec)
    await db.flush()
    return rec


async def approve_recognition(db: AsyncSession, tenant_id: str, recognition_id: UUID, approver_id: str):
    # lock the recognition row to prevent double-approval
    stmt = select(Recognition).where(
        Recognition.id == recognition_id,
        Recognition.tenant_id == tenant_id,
        Recognition.status == RecognitionStatus.PENDING,
    ).with_for_update()

    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()
    if not rec:
        raise NoResultFound("Recognition not found or already processed")

    # Get approver's department
    approver_stmt = select(User).where(User.id == approver_id, User.tenant_id == tenant_id)
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
