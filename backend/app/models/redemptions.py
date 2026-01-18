from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, Enum as SAEnum, ForeignKey, DateTime, String
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class RedemptionStatus(PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Redemption(Base, TenantMixin, TimestampMixin):
    __tablename__ = "redemptions"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reward_id = Column(String(36), ForeignKey("rewards.id"), nullable=False, index=True)
    points_used = Column(Integer, nullable=False)
    status = Column(SAEnum(RedemptionStatus, name="redemptionstatus"), nullable=False, default=RedemptionStatus.PENDING)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Monetary settlement fields (paise)
    gross_value_paise = Column(BigInteger, nullable=True)
    margin_paise = Column(BigInteger, nullable=True)
    vendor_cost_paise = Column(BigInteger, nullable=True)
    provider_name = Column(String(100), nullable=True)
