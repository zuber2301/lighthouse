from sqlalchemy import Column, String, Boolean, Integer
import uuid

from app.db.base import Base, TimestampMixin


class GlobalProvider(Base, TimestampMixin):
    __tablename__ = "global_providers"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    enabled = Column(Boolean, nullable=False, default=True)
    # minimum plan name required to enable this provider for a tenant (e.g., 'pro')
    min_plan = Column(String(50), nullable=True)
    # platform margin expressed in paise per 100 points redeemed (or absolute paise offset)
    margin_paise = Column(Integer, nullable=False, default=0)
