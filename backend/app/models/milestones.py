from sqlalchemy import Column, String, Date, Boolean
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class Milestone(Base, TenantMixin, TimestampMixin):
    __tablename__ = "milestones"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # tenant_id provided by TenantMixin
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    occurrence_date = Column(Date, nullable=True)
    points_processed = Column(Boolean, nullable=False, server_default='false')
