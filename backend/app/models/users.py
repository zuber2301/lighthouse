from enum import Enum as PyEnum
from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, Boolean, Integer, BigInteger, Date
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class UserRole(PyEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    PLATFORM_OWNER = "PLATFORM_OWNER"
    TENANT_ADMIN = "TENANT_ADMIN"
    TENANT_LEAD = "TENANT_LEAD"
    CORPORATE_USER = "CORPORATE_USER"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True, index=True)  # NULL for Platform Admins
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=True)  # NULL for OAuth users
    full_name = Column(String(100), nullable=True)
    role = Column(SAEnum(UserRole, name="userrole"), nullable=False)
    department = Column(String(100), nullable=True)  # Updated for department-based budgeting & announcements
    job_title = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    hire_date = Column(Date, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    points_balance = Column(Integer, nullable=False, default=0)  # For Corporate Users to redeem
    lead_budget_balance = Column(BigInteger, nullable=False, default=0)  # For Tenant Leads to distribute
    is_active = Column(Boolean, nullable=False, default=True)

    def __init__(self, **kwargs):
        # Ensure Python-level defaults are present on plain instances (tests expect this)
        if 'points_balance' not in kwargs:
            kwargs['points_balance'] = 0
        if 'lead_budget_balance' not in kwargs:
            kwargs['lead_budget_balance'] = 0
        super().__init__(**kwargs)
