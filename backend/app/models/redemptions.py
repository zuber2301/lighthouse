from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class RedemptionStatus(PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Redemption(Base, TenantMixin, TimestampMixin):
    __tablename__ = "redemptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reward_id = Column(UUID(as_uuid=True), ForeignKey("rewards.id"), nullable=False, index=True)
    points_used = Column(Integer, nullable=False)
    status = Column(SAEnum(RedemptionStatus, name="redemptionstatus"), nullable=False, default=RedemptionStatus.PENDING)
    completed_at = Column(DateTime(timezone=True), nullable=True)
