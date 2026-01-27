"""
Pydantic schemas for the Event Studio Wizard - multi-step event creation
"""

from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field, validator

from app.models.events import EventType


# ============================================================================
# STEP 1: BUDGET LOADING
# ============================================================================

class EventBudgetStep(BaseModel):
    """Step 1: Admin loads the event budget/wallet"""
    event_budget_amount: Decimal = Field(..., gt=0, description="Event budget in currency")
    budget_description: Optional[str] = Field(None, description="Purpose of budget")
    cost_type: str = Field("CURRENCY", description="CURRENCY or POINTS")
    

# ============================================================================
# STEP 2: BASIC EVENT INFO & MODE SELECTION
# ============================================================================

class EventBasicInfoStep(BaseModel):
    """Step 2: Basic event information and mode selection"""
    name: str = Field(..., min_length=1, max_length=255, description="Event name")
    description: Optional[str] = Field(None, description="Event description")
    event_type: EventType = Field(..., description="ANNUAL_DAY or GIFTING")
    event_date: datetime = Field(..., description="Event date and time")
    registration_start_date: datetime = Field(..., description="Registration opens")
    registration_end_date: datetime = Field(..., description="Registration closes")
    
    @validator('registration_end_date')
    def end_date_after_start(cls, v, values):
        if 'registration_start_date' in values and v <= values['registration_start_date']:
            raise ValueError('Registration end date must be after start date')
        return v
    
    @validator('event_date')
    def event_date_after_registration(cls, v, values):
        if 'registration_end_date' in values and v <= values['registration_end_date']:
            raise ValueError('Event date must be after registration closes')
        return v


# ============================================================================
# STEP 3: OPTIONS/TRACKS/GIFTS (Mode-Specific)
# ============================================================================

class PerformanceTrack(BaseModel):
    """For ANNUAL_DAY mode: Performance tracks (Singing, Dancing, etc.)"""
    track_name: str = Field(..., description="e.g., 'Singing', 'Dancing'")
    description: Optional[str] = None
    total_slots: int = Field(..., gt=0, description="Number of performers")
    duration_minutes: int = Field(..., gt=0, description="Duration of performance")


class VolunteerTask(BaseModel):
    """For ANNUAL_DAY mode: Volunteer tasks"""
    task_name: str = Field(..., description="e.g., 'Registration Desk', 'Ushering'")
    description: Optional[str] = None
    required_volunteers: int = Field(..., gt=0, description="Number of volunteers needed")
    duration_minutes: int = Field(..., gt=0, description="Duration of task")


class GiftItem(BaseModel):
    """For GIFTING mode: Gift items"""
    item_name: str = Field(..., description="Name of the gift")
    description: Optional[str] = None
    total_quantity: int = Field(..., gt=0, description="Total number of items available")
    unit_cost: Decimal = Field(..., gt=0, description="Cost per item")
    gift_image_url: Optional[str] = Field(None, description="URL to uploaded gift image")
    image_file_key: Optional[str] = Field(None, description="Storage key for the image")


class AnnualDayOptionsStep(BaseModel):
    """Step 3A: Options for ANNUAL_DAY events"""
    performance_tracks: List[PerformanceTrack] = Field(default_factory=list)
    volunteer_tasks: List[VolunteerTask] = Field(default_factory=list)


class GiftingOptionsStep(BaseModel):
    """Step 3B: Options for GIFTING events"""
    gifts: List[GiftItem] = Field(default=list, description="List of gifts to offer")
    total_gifts_value: Optional[Decimal] = Field(None, description="Total value of all gifts")
    
    @validator('total_gifts_value', always=True)
    def calculate_total_value(cls, v, values):
        if 'gifts' in values:
            return sum(g.unit_cost * g.total_quantity for g in values['gifts'])
        return v


# ============================================================================
# STEP 4: SCHEDULING (Gifting-Specific)
# ============================================================================

class PickupLocationInput(BaseModel):
    """Pickup location for gifting"""
    location_name: str = Field(..., description="e.g., 'Conference Room 402'")
    location_code: Optional[str] = Field(None, description="e.g., 'CR-402'")
    floor_number: Optional[int] = None
    building: Optional[str] = None
    capacity: int = Field(..., gt=0, description="Max concurrent people")


class TimeSlotGenerationConfig(BaseModel):
    """Configuration for automatic time slot generation"""
    slot_duration_minutes: int = Field(default=15, ge=5, le=60, description="15, 30, 60 minute slots")
    persons_per_slot: int = Field(default=20, gt=0, description="Max people per slot")
    operating_start_hour: int = Field(default=10, ge=0, le=23, description="Start hour (24-hour format)")
    operating_end_hour: int = Field(default=18, ge=0, le=23, description="End hour")
    
    @validator('operating_end_hour')
    def end_after_start(cls, v, values):
        if 'operating_start_hour' in values and v <= values['operating_start_hour']:
            raise ValueError('End hour must be after start hour')
        return v


class SchedulingStep(BaseModel):
    """Step 4: Scheduling configuration for gifting events"""
    pickup_locations: List[PickupLocationInput] = Field(..., description="Pickup locations")
    slot_generation: TimeSlotGenerationConfig = Field(default_factory=TimeSlotGenerationConfig)


# ============================================================================
# COMPLETE WIZARD SUBMISSION
# ============================================================================

class EventWizardComplete(BaseModel):
    """Complete event creation via wizard"""
    # Step 1: Budget
    event_budget_amount: Decimal = Field(..., gt=0)
    
    # Step 2: Basic Info
    name: str
    description: Optional[str] = None
    event_type: EventType
    event_date: datetime
    registration_start_date: datetime
    registration_end_date: datetime
    
    # Step 3: Options (mode-specific)
    performance_tracks: Optional[List[PerformanceTrack]] = None
    volunteer_tasks: Optional[List[VolunteerTask]] = None
    gifts: Optional[List[GiftItem]] = None
    
    # Step 4: Scheduling (for gifting mode)
    pickup_locations: Optional[List[PickupLocationInput]] = None
    slot_generation: Optional[TimeSlotGenerationConfig] = None


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PickupLocationOut(BaseModel):
    """Pickup location response"""
    id: str
    event_id: str
    location_name: str
    location_code: Optional[str]
    capacity: int
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TimeSlotOut(BaseModel):
    """Time slot response"""
    id: str
    location_id: str
    start_time: datetime
    end_time: datetime
    slot_label: str
    capacity: int
    registered_count: int
    available_capacity: int
    is_active: int
    
    class Config:
        from_attributes = True


class EventWizardResponse(BaseModel):
    """Response after wizard completion"""
    event_id: str
    name: str
    event_type: EventType
    event_budget_amount: Decimal
    budget_committed: Decimal
    event_date: datetime
    total_options: int
    total_pickup_locations: Optional[int] = 0
    total_time_slots: Optional[int] = 0
    created_at: datetime
    status: str = "CREATED"


# ============================================================================
# IMAGE UPLOAD
# ============================================================================

class ImageUploadResponse(BaseModel):
    """Response from image upload"""
    file_key: str = Field(..., description="Storage key for image")
    url: str = Field(..., description="Public URL to access image")
    content_type: str
    size_bytes: int
    uploaded_at: datetime


# ============================================================================
# VALIDATION & UTILITY
# ============================================================================

class TimeSlotData(BaseModel):
    """Internal model for time slot creation"""
    location_id: str
    event_id: str
    tenant_id: str
    start_time: datetime
    end_time: datetime
    slot_label: str
    capacity: int
