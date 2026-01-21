from sqlalchemy import Column, String, Numeric, ForeignKey
import uuid

from app.db.base import Base, TimestampMixin


class BudgetLoadLog(Base, TimestampMixin):
    __tablename__ = "budget_load_logs"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform_owner_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    tenant_id = Column(String(36), ForeignKey('tenants.id'), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)  # stored in currency units (e.g. INR)
    transaction_type = Column(String(50), nullable=False, server_default='DEPOSIT')
