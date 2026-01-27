"""
Pydantic schemas for approval request API
"""

from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ApprovalRequestCreate(BaseModel):
    """Request body for creating an approval request"""
    event_option_id: str = Field(..., description="ID of the event option being requested")
    impact_hours_per_week: float = Field(..., description="Work hours per week (e.g., 3.5)")
    impact_duration_weeks: int = Field(..., description="Duration in weeks")
    notes: Optional[str] = Field(None, description="Optional notes from requester")


class ApprovalRequestResponse(BaseModel):
    """Response schema for approval request details"""
    id: str
    event_id: str
    user_id: str
    event_option_id: str
    lead_id: str
    
    # Impact metrics
    impact_hours_per_week: Decimal
    impact_duration_weeks: int
    total_impact_hours: Decimal
    
    # Budget
    estimated_cost: Decimal
    budget_committed: int
    
    # Status
    status: str
    
    # QR Code
    qr_token: Optional[str] = None
    qr_code_url: Optional[str] = None
    qr_activated_at: Optional[datetime] = None
    
    # Approval trail
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    declined_at: Optional[datetime] = None
    declined_by: Optional[str] = None
    decline_reason: Optional[str] = None
    
    # Metadata
    request_notes: Optional[str] = None
    approval_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApprovalRequestListItem(BaseModel):
    """Summary view for approval inbox"""
    id: str
    event_id: str
    user_id: str
    event_option_id: str
    
    # User info
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    # Event info
    event_name: Optional[str] = None
    
    # Option info
    option_name: Optional[str] = None
    
    # Impact metrics
    impact_hours_per_week: Decimal
    impact_duration_weeks: int
    total_impact_hours: Decimal
    
    # Status
    status: str
    
    # Timestamps
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApprovalDecision(BaseModel):
    """Request body for approve/decline decisions"""
    decision: str = Field(..., description="APPROVE or DECLINE")
    notes: Optional[str] = Field(None, description="Approval/decline notes")


class ApprovalDeclineResponse(BaseModel):
    """Response after declining with alternatives"""
    request_id: str
    status: str
    decline_reason: Optional[str]
    alternatives: list[dict] = Field(
        default_factory=list,
        description="Alternative event options available"
    )


class QRCodeActivationResponse(BaseModel):
    """Response when QR code is activated"""
    request_id: str
    user_id: str
    event_id: str
    status: str
    activated_at: datetime
    message: str


class ApprovalInboxResponse(BaseModel):
    """Response for lead's approval inbox"""
    pending_count: int
    total_pending_impact_hours: Decimal
    requests: list[ApprovalRequestListItem]
