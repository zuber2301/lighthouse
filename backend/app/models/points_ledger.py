from sqlalchemy import Column, Integer, Text, ForeignKey, String
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class PointsLedger(Base, TenantMixin, TimestampMixin):
    __tablename__ = "points_ledger"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    delta = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    reference_id = Column(String(36), nullable=True)
