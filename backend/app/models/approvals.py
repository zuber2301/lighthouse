"""
Approval request models for Phase 4: Governance Loop
Tracks approval requests from users to join events/tracks
"""

from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, DateTime, Enum as SAEnum, Text, func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class ApprovalStatus(PyEnum):
    """Status of an approval request"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"


class ApprovalRequest(Base, TenantMixin, TimestampMixin):
    """
    Approval request from a user to join an event/track.
    
    Flow:
    1. User selects event and track/option
    2. System calculates impact hours (work-hour utilization)
    3. Request goes to tenant lead for approval
    4. Lead approves/declines
    5. If approved: QR code generated, budget committed
    6. If declined: User gets notification with alternatives
    """
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Event and option context
    event_id = Column(String(36), ForeignKey('events.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    event_option_id = Column(String(36), ForeignKey('event_options.id'), nullable=False)
    
    # Approval chain
    lead_id = Column(String(36), ForeignKey('users.id'), nullable=False)  # Tenant lead approving
    
    # Impact analysis (work-hour utilization)
    impact_hours_per_week = Column(Numeric(5, 2), nullable=False)  # e.g., 3.5 hours/week
    impact_duration_weeks = Column(Integer, nullable=False)         # Duration of commitment
    total_impact_hours = Column(Numeric(8, 2), nullable=False)      # Total over duration
    
    # Budget impact
    estimated_cost = Column(Numeric(12, 2), nullable=False, default=0)  # Cost from event budget
    
    # Status and decisions
    status = Column(SAEnum(ApprovalStatus, name="approval_status"), nullable=False, default=ApprovalStatus.PENDING)
    
    # Approval audit trail
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(36), ForeignKey('users.id'), nullable=True)  # Could differ from lead
    
    declined_at = Column(DateTime(timezone=True), nullable=True)
    declined_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    decline_reason = Column(Text, nullable=True)
    
    # QR code and verification (generated on approval)
    qr_token = Column(String(255), nullable=True, unique=True)        # Unique QR code
    qr_code_url = Column(String(500), nullable=True)                  # URL to QR image
    qr_activated_at = Column(DateTime(timezone=True), nullable=True)  # When QR was scanned
    
    # Budget commitment tracking
    budget_committed = Column(Integer, nullable=False, default=0)  # 1 = committed, 0 = not
    committed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Notification tracking
    notification_sent = Column(Integer, nullable=False, default=0)  # 1 = sent, 0 = not sent
    
    # Collection/Distribution tracking (Phase 5: Day-of-Event Logistics)
    is_collected = Column(Integer, nullable=False, default=0)  # 1 = collected at event, 0 = not
    collected_at = Column(DateTime(timezone=True), nullable=True)  # When gift was scanned/collected
    collected_by = Column(String(36), ForeignKey('users.id'), nullable=True)  # Admin who scanned
    
    # Metadata
    request_notes = Column(Text, nullable=True)
    approval_notes = Column(Text, nullable=True)

    # Relationships
    event = relationship("Event")
    user = relationship("User", foreign_keys=[user_id])
    lead = relationship("User", foreign_keys=[lead_id])
    option = relationship("EventOption")
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    declined_by_user = relationship("User", foreign_keys=[declined_by])
    collected_by_user = relationship("User", foreign_keys=[collected_by])

    @property
    def is_pending(self) -> bool:
        """Check if request is still pending"""
        return self.status == ApprovalStatus.PENDING

    @property
    def is_approved(self) -> bool:
        """Check if request is approved"""
        return self.status == ApprovalStatus.APPROVED

    @property
    def is_declined(self) -> bool:
        """Check if request is declined"""
        return self.status == ApprovalStatus.DECLINED

    @property
    def is_actionable(self) -> bool:
        """Check if request can still be acted upon"""
        return self.status in (ApprovalStatus.PENDING,)

    @property
    def is_scannable(self) -> bool:
        """Check if request can be scanned at event (Phase 5)"""
        return self.is_approved and not self.is_collected
