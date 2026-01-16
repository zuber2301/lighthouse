from sqlalchemy import Column, String, Integer, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class Reward(Base, TenantMixin, TimestampMixin):
    __tablename__ = "rewards"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    cost_points = Column(Integer, nullable=False)
    provider = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)
    is_active = Column(Boolean, nullable=False, server_default='true')
