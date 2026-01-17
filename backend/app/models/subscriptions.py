from sqlalchemy import Column, String, BigInteger, JSON, Date, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base, TimestampMixin


class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    monthly_price_in_paise = Column(BigInteger, nullable=True)
    features = Column(JSON, nullable=True)


class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"
    tenant_id = Column(String(36), ForeignKey('tenants.id'), primary_key=True)
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'), primary_key=True)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    tenant = relationship("Tenant")
    plan = relationship("SubscriptionPlan")