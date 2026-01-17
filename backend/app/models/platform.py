from sqlalchemy import Column, JSON, String
import uuid

from app.db.base import Base


class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    # singleton pattern: use a known id like 'global'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policies = Column(JSON, nullable=True)
