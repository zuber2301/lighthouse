from enum import Enum as PyEnum
from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, BigInteger, Text
import uuid

from app.db.base import Base, TimestampMixin


class TransactionType(PyEnum):
    LOAD = "LOAD"
    ALLOCATE = "ALLOCATE"
    RECOGNITION = "RECOGNITION"
    REDEMPTION = "REDEMPTION"


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True, index=True)
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    receiver_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    amount = Column(BigInteger, nullable=False)
    type = Column(SAEnum(TransactionType, name="transactiontype"), nullable=False)
    note = Column(Text, nullable=True)