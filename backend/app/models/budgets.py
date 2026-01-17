from sqlalchemy import Column, String, Integer, ForeignKey, Numeric
import uuid
from sqlalchemy.orm import relationship

from app.db.base import Base, TenantMixin, TimestampMixin


class BudgetPool(Base, TenantMixin, TimestampMixin):
    __tablename__ = "budget_pools"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    period = Column(String(20), nullable=False)  # FY2026 / 2026-Q1
    total_amount = Column(Numeric(12, 2), nullable=False)  # currency amount
    created_by = Column(String(36), ForeignKey('users.id'), nullable=False)

    # relationship
    created_by_user = relationship("User")


class DepartmentBudget(Base, TenantMixin, TimestampMixin):
    __tablename__ = "department_budgets"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_pool_id = Column(String(36), ForeignKey('budget_pools.id'), nullable=False)
    department_id = Column(String(50), nullable=False)  # e.g., "eng", "sales"
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    used_amount = Column(Numeric(12, 2), nullable=False, default=0)

    # relationship
    budget_pool = relationship("BudgetPool")


class BudgetLedger(Base, TenantMixin, TimestampMixin):
    __tablename__ = "budget_ledger"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(50), nullable=False)
    delta_amount = Column(Numeric(12, 2), nullable=False)  # positive for allocation, negative for usage
    reason = Column(String(20), nullable=False)  # ALLOCATION / RECOGNITION
    reference_id = Column(String(36), nullable=False)  # id of allocation or recognition
