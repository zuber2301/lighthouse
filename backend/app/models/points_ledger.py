from sqlalchemy import Column, Integer, Text, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class PointsLedger(Base, TenantMixin, TimestampMixin):
    __tablename__ = "points_ledger"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    delta = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
