from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, ForeignKey, Enum as SAEnum, Text, String
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
    value_tag = Column(String(100), nullable=True)
    points = Column(Integer, nullable=False, default=0)
    message = Column(Text, nullable=True)
    status = Column(SAEnum(RecognitionStatus, name="recognitionstatus"), nullable=False, default=RecognitionStatus.PENDING)

    nominator = relationship("User", foreign_keys=[nominator_id])
    nominee = relationship("User", foreign_keys=[nominee_id])
