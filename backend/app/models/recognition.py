from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, ForeignKey, Enum as SAEnum, Text, String, Boolean
import uuid

from sqlalchemy.orm import relationship

from app.db.base import Base, TenantMixin, TimestampMixin


class RecognitionStatus(PyEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"


class Recognition(Base, TenantMixin, TimestampMixin):
    __tablename__ = "recognitions"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nominator_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    nominee_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    # optional badge reference for awarded digital badge
    badge_id = Column(String(36), ForeignKey("badges.id"), nullable=True, index=True)
    value_tag = Column(String(100), nullable=True)
    points = Column(Integer, nullable=False, default=0)
    message = Column(Text, nullable=True)
    points_awarded = Column(Integer, nullable=False, default=0)
    is_public = Column(Boolean, nullable=False, server_default='true')
    status = Column(SAEnum(RecognitionStatus, name="recognitionstatus"), nullable=False, default=RecognitionStatus.PENDING)
    ecard_url = Column(String(255), nullable=True)
    area_of_focus = Column(String(100), nullable=True)
    media_url = Column(String(255), nullable=True)

    nominator = relationship("User", foreign_keys=[nominator_id])
    nominee = relationship("User", foreign_keys=[nominee_id])
    badge = relationship("Badge", back_populates="recognitions")
