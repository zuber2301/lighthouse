from sqlalchemy import Column, String, JSON, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base, TimestampMixin


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, unique=True)
    branding_config = Column(JSON, nullable=True, default=dict)
    feature_flags = Column(JSON, nullable=True, default=dict)
    # platform controls
    status = Column(String(32), nullable=False, server_default='ACTIVE')
    suspended = Column(Boolean, nullable=False, server_default='false')
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspended_reason = Column(String(500), nullable=True)
