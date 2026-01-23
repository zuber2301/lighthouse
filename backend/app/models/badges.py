from sqlalchemy import Column, Integer, String, Text
import uuid

from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Badge(Base, TimestampMixin):
    __tablename__ = "badges"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # tenant_id explicitly nullable: NULL indicates a global badge
    tenant_id = Column(String(36), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    icon_url = Column(Text, nullable=True)
    points_value = Column(Integer, nullable=False, default=0)
    category = Column(String(50), nullable=True)

    recognitions = relationship("Recognition", back_populates="badge")
