from sqlalchemy import Column, String, JSON, Boolean, DateTime, BigInteger
import uuid

from app.db.base import Base, TimestampMixin


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), nullable=False, unique=True)
    master_budget_balance = Column(BigInteger, nullable=False, default=0)  # Total company wallet
    logo_url = Column(String, nullable=True)
    status = Column(String(20), nullable=False, server_default='active')
    # platform controls
    suspended = Column(Boolean, nullable=False, server_default='false')
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspended_reason = Column(String(500), nullable=True)
