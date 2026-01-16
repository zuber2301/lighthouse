from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.rbac import require_role
from app.core.auth import get_current_user, User as CurrentUser
from app.models.budgets import BudgetPool, DepartmentBudget, BudgetLedger
from typing import Optional, List

router = APIRouter(prefix="/admin")


@router.get("/status")
async def status():
    return {"status": "tenant admin ok"}


@router.post("/budgets/{budget_id}/allocate")
async def allocate_budget(budget_id: str, payload: dict, db: AsyncSession = Depends(get_db), user: CurrentUser = Depends(require_role("TENANT_ADMIN")), request: Request = None):
    allocations = payload.get("allocations", [])
    if not allocations:
        raise HTTPException(status_code=400, detail="allocations required")
    
    tenant = getattr(request.state, "tenant_id", None)
    q = await db.execute(select(BudgetPool).where(BudgetPool.id == budget_id, BudgetPool.tenant_id == tenant))
    pool = q.scalar_one_or_none()
    if not pool:
        raise HTTPException(status_code=404, detail="Budget pool not found")
    
    total_allocated = sum(a["amount"] for a in allocations)
    if total_allocated != pool.total_amount:
        raise HTTPException(status_code=400, detail="Total allocated must equal total budget")
    
    # Check for duplicates
    dept_ids = [a["department_id"] for a in allocations]
    if len(dept_ids) != len(set(dept_ids)):
        raise HTTPException(status_code=400, detail="Duplicate department_ids")
    
    # Create department budgets
    dept_budgets = []
    ledger_entries = []
    for alloc in allocations:
        dept_budget = DepartmentBudget(
            tenant_id=tenant,
            budget_pool_id=pool.id,
            department_id=alloc["department_id"],
            allocated_amount=alloc["amount"]
        )
        db.add(dept_budget)
        dept_budgets.append(dept_budget)
        
        # Ledger entry for allocation
        ledger = BudgetLedger(
            tenant_id=tenant,
            department_id=alloc["department_id"],
            delta_amount=alloc["amount"],
            reason="ALLOCATION",
            reference_id=dept_budget.id
        )
        db.add(ledger)
        ledger_entries.append(ledger)
    
    await db.commit()
    for db in dept_budgets:
        await db.refresh(db)
    for le in ledger_entries:
        await db.refresh(le)
    
    return {"budget_pool_id": pool.id, "allocations": [{"department_id": db.department_id, "amount": str(db.allocated_amount)} for db in dept_budgets]}


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