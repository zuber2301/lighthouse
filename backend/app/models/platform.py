from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base


class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    # singleton pattern: use a known id like 'global'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policies = Column(JSON, nullable=True)
