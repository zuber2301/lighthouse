from enum import Enum as PyEnum
from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class UserRole(PyEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TENANT_ADMIN = "TENANT_ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class User(Base, TenantMixin, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String(320), nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    role = Column(SAEnum(UserRole, name="userrole"), nullable=False)
    department = Column(String(50), nullable=True)  # e.g., "eng", "sales"
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # External identity from SSO/HRIS systems (e.g. Okta user id, Azure object id, Workday employee id)
    external_id = Column(String(128), nullable=True, index=True)
    # Identifier of the SSO/HRIS provider that issued `external_id` (okta, azure_ad, workday, ...)
    sso_provider = Column(String(50), nullable=True, index=True)
    is_active = Column(Boolean, nullable=False, server_default='true')

    manager = relationship("User", remote_side=[id], uselist=False)
