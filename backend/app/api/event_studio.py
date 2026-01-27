"""
Event Studio API - Multi-step wizard for event creation and configuration
"""

from typing import List, Optional
from uuid import uuid4
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import os
from datetime import datetime

from app.core.auth import get_current_user
from app.core import tenancy
from app.db.session import get_db
from app.models.events import Event, EventOption, EventPickupLocation
from app.models.users import User
from app.schemas.event_wizard import (
    EventBudgetStep,
    EventBasicInfoStep,
    AnnualDayOptionsStep,
    GiftingOptionsStep,
    SchedulingStep,
    EventWizardComplete,
    EventWizardResponse,
    ImageUploadResponse,
    PickupLocationOut,
)
from app.services.event_service import EventService
from app.services.scheduling_engine import SchedulingEngine

router = APIRouter(prefix="/events/wizard", tags=["event-studio"])

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_upload_dir() -> str:
    """Get or create uploads directory for gift images"""
    upload_dir = os.path.join(os.getcwd(), "uploads", "gifts")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


async def save_gift_image(file: UploadFile) -> tuple[str, str]:
    """
    Save uploaded gift image and return (file_key, public_url)
    
    file_key: Unique identifier for storage
    public_url: URL to access the image
    """
    upload_dir = get_upload_dir()
    
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    file_key = f"gift-{uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, file_key)
    
    # Save file
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return file key and public URL
    public_url = f"/uploads/gifts/{file_key}"
    return file_key, public_url


# ============================================================================
# STEP 1: BUDGET LOADING
# ============================================================================

@router.post("/step1/budget")
async def step1_budget(
    payload: EventBudgetStep,
    current_user: User = Depends(get_current_user),
):
    """
    Step 1: Admin loads the event budget.
    Validates budget amount and returns confirmation.
    
    This creates a temporary session object to track wizard progress.
    """
    # In a real app, this would create a temporary session
    # For now, just validate and return
    
    if payload.event_budget_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget amount must be positive"
        )
    
    return {
        "step": 1,
        "status": "COMPLETED",
        "budget_amount": payload.event_budget_amount,
        "message": "Budget loaded successfully"
    }


# ============================================================================
# STEP 2: BASIC EVENT INFO & MODE SELECTION
# ============================================================================

@router.post("/step2/event-info")
async def step2_event_info(
    payload: EventBasicInfoStep,
    current_user: User = Depends(get_current_user),
):
    """
    Step 2: Admin provides basic event information and selects event type.
    
    Validates dates and event configuration.
    """
    now = datetime.utcnow()
    
    if payload.registration_start_date < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration start date must be in the future"
        )
    
    if payload.event_date <= payload.registration_end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event date must be after registration closes"
        )
    
    return {
        "step": 2,
        "status": "COMPLETED",
        "event_name": payload.name,
        "event_type": payload.event_type.value,
        "event_date": payload.event_date,
        "message": f"Event '{payload.name}' configured as {payload.event_type.value}"
    }


# ============================================================================
# STEP 3: OPTIONS/TRACKS/GIFTS (Mode-Specific)
# ============================================================================

@router.post("/step3/options/annual-day")
async def step3_annual_day_options(
    payload: AnnualDayOptionsStep,
    current_user: User = Depends(get_current_user),
):
    """
    Step 3A: Configure performance tracks and volunteer tasks for Annual Day event.
    
    Validates that at least one option is provided.
    """
    total_options = len(payload.performance_tracks) + len(payload.volunteer_tasks)
    
    if total_options == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one track or task is required"
        )
    
    return {
        "step": 3,
        "status": "COMPLETED",
        "event_type": "ANNUAL_DAY",
        "tracks_count": len(payload.performance_tracks),
        "tasks_count": len(payload.volunteer_tasks),
        "total_slots": sum(t.total_slots for t in payload.performance_tracks) + 
                      sum(t.required_volunteers for t in payload.volunteer_tasks),
        "message": f"Configured {len(payload.performance_tracks)} tracks and {len(payload.volunteer_tasks)} tasks"
    }


@router.post("/step3/options/gifting")
async def step3_gifting_options(
    payload: GiftingOptionsStep,
    current_user: User = Depends(get_current_user),
):
    """
    Step 3B: Configure gift items for Gifting event.
    
    Validates gifts have images and proper pricing.
    """
    if not payload.gifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one gift is required"
        )
    
    for gift in payload.gifts:
        if not gift.gift_image_url and not gift.image_file_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gift '{gift.item_name}' must have an image"
            )
    
    total_gifts = sum(g.total_quantity for g in payload.gifts)
    total_value = sum(g.unit_cost * g.total_quantity for g in payload.gifts)
    
    return {
        "step": 3,
        "status": "COMPLETED",
        "event_type": "GIFTING",
        "gifts_count": len(payload.gifts),
        "total_gifts": total_gifts,
        "total_value": float(total_value),
        "message": f"Configured {len(payload.gifts)} gift items ({total_gifts} units, {total_value} total value)"
    }


# ============================================================================
# IMAGE UPLOAD FOR GIFTS
# ============================================================================

@router.post("/upload-gift-image", response_model=ImageUploadResponse)
async def upload_gift_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image for a gift item.
    
    Returns file_key and public_url for use in gift configuration.
    """
    file_key, public_url = await save_gift_image(file)
    
    file_size = len(await file.read())
    await file.seek(0)
    
    return ImageUploadResponse(
        file_key=file_key,
        url=public_url,
        content_type=file.content_type,
        size_bytes=file_size,
        uploaded_at=datetime.utcnow()
    )


# ============================================================================
# STEP 4: SCHEDULING (Gifting-Specific)
# ============================================================================

@router.post("/step4/scheduling")
async def step4_scheduling(
    payload: SchedulingStep,
    current_user: User = Depends(get_current_user),
):
    """
    Step 4: Configure pickup locations and time slots for gifting events.
    
    Validates scheduling configuration and generates time slots.
    """
    if not payload.pickup_locations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one pickup location is required"
        )
    
    # Validate time slot configuration
    is_valid, error_msg = SchedulingEngine.validate_slot_configuration(
        payload.slot_generation.slot_duration_minutes,
        payload.slot_generation.operating_start_hour,
        payload.slot_generation.operating_end_hour,
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scheduling configuration: {error_msg}"
        )
    
    # Calculate expected time slots
    total_hours = payload.slot_generation.operating_end_hour - payload.slot_generation.operating_start_hour
    slots_per_hour = 60 // payload.slot_generation.slot_duration_minutes
    expected_slots_per_location = total_hours * slots_per_hour
    
    return {
        "step": 4,
        "status": "COMPLETED",
        "locations_count": len(payload.pickup_locations),
        "slot_duration_minutes": payload.slot_generation.slot_duration_minutes,
        "persons_per_slot": payload.slot_generation.persons_per_slot,
        "expected_slots_per_location": expected_slots_per_location,
        "total_expected_slots": expected_slots_per_location * len(payload.pickup_locations),
        "message": f"Configured {len(payload.pickup_locations)} pickup locations with {expected_slots_per_location} slots each"
    }


# ============================================================================
# COMPLETE WIZARD SUBMISSION
# ============================================================================

@router.post("/submit", response_model=EventWizardResponse, status_code=status.HTTP_201_CREATED)
async def submit_wizard(
    payload: EventWizardComplete,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Final submission: Create event with all configured options and scheduling.
    
    This is a comprehensive endpoint that creates:
    1. Event
    2. Event options (tracks/tasks or gifts)
    3. Pickup locations (if gifting mode)
    4. Time slots (if gifting mode)
    """
    tenant_id = tenancy.CURRENT_TENANT.get()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required"
        )
    
    event_id = str(uuid4())
    
    try:
        # Create event
        event = Event(
            id=event_id,
            tenant_id=tenant_id,
            name=payload.name,
            description=payload.description,
            event_type=payload.event_type,
            event_budget_amount=payload.event_budget_amount,
            event_date=payload.event_date,
            registration_start_date=payload.registration_start_date,
            registration_end_date=payload.registration_end_date,
            created_by=current_user.id,
        )
        db.add(event)
        await db.flush()
        
        option_count = 0
        
        # Create options based on event type
        if payload.event_type.value == "ANNUAL_DAY":
            # Create performance tracks
            if payload.performance_tracks:
                for track in payload.performance_tracks:
                    option = EventOption(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        event_id=event_id,
                        option_name=track.track_name,
                        option_type="TRACK",
                        description=track.description,
                        total_available=track.total_slots,
                    )
                    db.add(option)
                    option_count += 1
            
            # Create volunteer tasks
            if payload.volunteer_tasks:
                for task in payload.volunteer_tasks:
                    option = EventOption(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        event_id=event_id,
                        option_name=task.task_name,
                        option_type="VOLUNTEER",
                        description=task.description,
                        total_available=task.required_volunteers,
                    )
                    db.add(option)
                    option_count += 1
        
        elif payload.event_type.value == "GIFTING":
            # Create gift items
            if payload.gifts:
                for gift in payload.gifts:
                    option = EventOption(
                        id=str(uuid4()),
                        tenant_id=tenant_id,
                        event_id=event_id,
                        option_name=gift.item_name,
                        option_type="GIFT",
                        description=gift.description,
                        total_available=gift.total_quantity,
                        cost_per_unit=gift.unit_cost,
                        gift_image_url=gift.gift_image_url or f"/uploads/gifts/{gift.image_file_key}",
                    )
                    db.add(option)
                    option_count += 1
            
            # Create pickup locations and time slots
            location_count = 0
            slot_count = 0
            
            if payload.pickup_locations:
                for loc_input in payload.pickup_locations:
                    location_id = str(uuid4())
                    location = EventPickupLocation(
                        id=location_id,
                        tenant_id=tenant_id,
                        event_id=event_id,
                        location_name=loc_input.location_name,
                        location_code=loc_input.location_code,
                        floor_number=loc_input.floor_number,
                        building=loc_input.building,
                        capacity=loc_input.capacity,
                    )
                    db.add(location)
                    location_count += 1
                    await db.flush()
                    
                    # Generate time slots for this location
                    slot_config = payload.slot_generation
                    created_slot_ids = await SchedulingEngine.create_time_slots_for_location(
                        db,
                        location_id=location_id,
                        event_id=event_id,
                        tenant_id=tenant_id,
                        event_date=payload.event_date,
                        slot_duration_minutes=slot_config.slot_duration_minutes,
                        persons_per_slot=slot_config.persons_per_slot,
                        operating_start_hour=slot_config.operating_start_hour,
                        operating_end_hour=slot_config.operating_end_hour,
                    )
                    slot_count += len(created_slot_ids)
        
        await db.commit()
        
        return EventWizardResponse(
            event_id=event_id,
            name=payload.name,
            event_type=payload.event_type,
            event_budget_amount=payload.event_budget_amount,
            budget_committed=Decimal(0),
            event_date=payload.event_date,
            total_options=option_count,
            total_pickup_locations=location_count if payload.event_type.value == "GIFTING" else 0,
            total_time_slots=slot_count if payload.event_type.value == "GIFTING" else 0,
            created_at=datetime.utcnow(),
            status="CREATED"
        )
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create event: {str(e)}"
        )


# ============================================================================
# PREVIEW & RETRIEVAL
# ============================================================================

@router.get("/events/{event_id}/preview")
async def preview_wizard_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Preview a wizard-created event with all its configuration.
    """
    tenant_id = tenancy.CURRENT_TENANT.get()
    
    stmt = select(Event).where(
        and_(Event.id == event_id, Event.tenant_id == tenant_id)
    ).options(
        selectinload(Event.options),
        selectinload(Event.pickup_locations).selectinload(EventPickupLocation.time_slots)
    )
    
    result = await db.execute(stmt)
    event = result.unique().scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    return {
        "id": event.id,
        "name": event.name,
        "event_type": event.event_type.value,
        "event_date": event.event_date,
        "budget_amount": float(event.event_budget_amount),
        "budget_committed": float(event.budget_committed),
        "budget_available": float(event.budget_available),
        "options": [
            {
                "id": opt.id,
                "name": opt.option_name,
                "type": opt.option_type,
                "total": opt.total_available,
                "committed": opt.committed_count,
                "available": opt.available_slots,
                "image_url": opt.gift_image_url,
            }
            for opt in event.options
        ],
        "pickup_locations": [
            {
                "id": loc.id,
                "name": loc.location_name,
                "capacity": loc.capacity,
                "time_slots": [
                    {
                        "id": slot.id,
                        "label": slot.slot_label,
                        "capacity": slot.capacity,
                        "registered": slot.registered_count,
                    }
                    for slot in loc.time_slots
                ]
            }
            for loc in event.pickup_locations
        ] if event.event_type.value == "GIFTING" else [],
    }
