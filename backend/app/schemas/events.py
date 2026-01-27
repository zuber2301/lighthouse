from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.events import EventType, RegistrationStatus


class EventOptionCreate(BaseModel):
    """Schema for creating an event option"""
    option_name: str = Field(..., description="Name of the option (e.g., 'Singing Track')")
    option_type: str = Field(..., description="Type: TRACK or INVENTORY")
    description: Optional[str] = None
    total_available: int = Field(..., gt=0, description="Total slots/inventory available")
    cost_per_unit: Optional[Decimal] = Field(None, ge=0, description="Cost per unit if applicable")


class EventOptionOut(EventOptionCreate):
    """Schema for event option response"""
    id: str
    event_id: str
    committed_count: int
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventOptionVariance(BaseModel):
    """Budget variance info for an event option"""
    option_id: str
    option_name: str
    total_available: int
    committed_count: int
    available_slots: int
    utilization_percentage: float


class EventCreate(BaseModel):
    """Schema for creating an event"""
    name: str = Field(..., description="Event name")
    description: Optional[str] = None
    event_type: EventType = Field(..., description="ANNUAL_DAY or GIFTING")
    event_budget_amount: Decimal = Field(..., gt=0, description="Event budget in currency")
    event_date: datetime = Field(..., description="Date/time of the event")
    registration_start_date: datetime = Field(..., description="When registration opens")
    registration_end_date: datetime = Field(..., description="When registration closes")
    options: List[EventOptionCreate] = Field(default_factory=list, description="Event options to create")


class EventUpdate(BaseModel):
    """Schema for updating an event"""
    name: Optional[str] = None
    description: Optional[str] = None
    event_budget_amount: Optional[Decimal] = None
    event_date: Optional[datetime] = None
    registration_start_date: Optional[datetime] = None
    registration_end_date: Optional[datetime] = None
    is_active: Optional[int] = None


class EventOut(BaseModel):
    """Schema for event response"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    event_type: EventType
    event_budget_amount: Decimal
    budget_committed: Decimal
    event_date: datetime
    registration_start_date: datetime
    registration_end_date: datetime
    is_active: int
    created_at: datetime
    options: List[EventOptionOut] = []
    
    class Config:
        from_attributes = True


class BudgetVarianceResponse(BaseModel):
    """Budget variance report for an event"""
    event_id: str
    event_name: str
    total_budget: Decimal
    budget_committed: Decimal
    budget_available: Decimal
    utilization_percentage: float
    registered_users_count: int
    approved_registrations_count: int
    pending_registrations_count: int
    option_variance: List[EventOptionVariance] = []


class EventRegistrationCreate(BaseModel):
    """Schema for creating an event registration"""
    event_id: str = Field(..., description="Event ID")
    event_option_id: Optional[str] = Field(None, description="Selected event option ID")
    preferred_pickup_slot: Optional[str] = Field(None, description="Preferred pickup time slot")
    notes: Optional[str] = None


class EventRegistrationUpdate(BaseModel):
    """Schema for updating registration status"""
    status: RegistrationStatus = Field(..., description="New status")
    assigned_pickup_slot: Optional[str] = Field(None, description="Assign a pickup slot")
    notes: Optional[str] = None


class EventRegistrationOut(BaseModel):
    """Schema for event registration response"""
    id: str
    event_id: str
    user_id: str
    event_option_id: Optional[str]
    status: RegistrationStatus
    qr_token: Optional[str]
    preferred_pickup_slot: Optional[str]
    assigned_pickup_slot: Optional[str]
    amount_committed: Decimal
    notes: Optional[str]
    created_at: datetime
    approved_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ConflictDetectionResult(BaseModel):
    """Result of conflict detection check"""
    has_conflict: bool
    conflict_type: Optional[str] = None  # "OVERBOOKING_TIME", "INVENTORY_EXHAUSTED", "SLOT_CONFLICT"
    conflict_message: Optional[str] = None
    available_alternatives: Optional[List[str]] = None  # List of available slots/items as alternatives
