from sqlalchemy import Column, String, Integer, JSON, Boolean
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class Reward(Base, TenantMixin, TimestampMixin):
    __tablename__ = "rewards"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    cost_points = Column(Integer, nullable=False)
    provider = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)
    is_active = Column(Boolean, nullable=False, server_default='true')
