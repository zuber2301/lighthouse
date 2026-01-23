from sqlalchemy import Column, String, JSON, DateTime, Integer
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class PlatformAuditLog(Base):
    __tablename__ = "platform_audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    target_tenant_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())