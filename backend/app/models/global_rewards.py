from sqlalchemy import Column, String, Integer, Boolean
import uuid

from app.db.base import Base, TimestampMixin


class GlobalReward(Base, TimestampMixin):
    __tablename__ = "global_rewards"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=True)
    points_cost = Column(Integer, nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)