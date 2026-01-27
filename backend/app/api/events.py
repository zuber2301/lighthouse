"""
FastAPI router for event management endpoints.
Provides CRUD operations for events, event options, and event registrations,
plus budget variance and conflict detection.
"""

from typing import List, Optional
from uuid import uuid4
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.rbac import require_role
from app.core import tenancy
from app.db.session import get_db
from app.models.events import (
    Event,
    EventOption,
    EventRegistration,
    RegistrationStatus,
    EventType,
)
from app.models.users import User, UserRole
from app.schemas.events import (
    EventCreate,
    EventUpdate,
    EventOut,
    EventOptionCreate,
    EventOptionOut,
    EventRegistrationCreate,
    EventRegistrationUpdate,
    EventRegistrationOut,
    BudgetVarianceResponse,
    ConflictDetectionResult,
)
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


# ============================================================================
# EVENT CRUD ENDPOINTS
# ============================================================================


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new event.
    
    - **name**: Event name
    - **event_type**: ANNUAL_DAY or GIFTING
    - **event_budget_amount**: Total budget for the event
    - **options**: Initial event options (tracks/inventory)
    """
    tenant_id = tenancy.CURRENT_TENANT.get()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required"
        )

    # Create event
    event_id = str(uuid4())
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

    # Create event options if provided
    if payload.options:
        for opt_payload in payload.options:
            option = EventOption(
                id=str(uuid4()),
                tenant_id=tenant_id,
                event_id=event_id,
                option_name=opt_payload.option_name,
                option_type=opt_payload.option_type,
                description=opt_payload.description,
                total_available=opt_payload.total_available,
                cost_per_unit=opt_payload.cost_per_unit,
            )
            db.add(option)

    await db.commit()
    await db.refresh(event, ["options"])
    return event


@router.get("", response_model=List[EventOut])
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    is_active: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List events for the current tenant.
    
    - **skip**: Number of results to skip
    - **limit**: Max results to return
    - **is_active**: Filter by active status (1 or 0)
    """
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(Event).where(Event.tenant_id == tenant_id)

    if is_active is not None:
        stmt = stmt.where(Event.is_active == is_active)

    stmt = (
        stmt.options(selectinload(Event.options))
        .offset(skip)
        .limit(limit)
        .order_by(Event.created_at.desc())
    )

    result = await db.execute(stmt)
    events = result.unique().scalars().all()
    return events


@router.get("/{event_id}", response_model=EventOut)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific event"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = (
        select(Event)
        .where(and_(Event.id == event_id, Event.tenant_id == tenant_id))
        .options(selectinload(Event.options))
    )

    result = await db.execute(stmt)
    event = result.unique().scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    return event


@router.put("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an event"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(Event).where(
        and_(Event.id == event_id, Event.tenant_id == tenant_id)
    )
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Update fields if provided
    if payload.name is not None:
        event.name = payload.name
    if payload.description is not None:
        event.description = payload.description
    if payload.event_budget_amount is not None:
        event.event_budget_amount = payload.event_budget_amount
    if payload.event_date is not None:
        event.event_date = payload.event_date
    if payload.registration_start_date is not None:
        event.registration_start_date = payload.registration_start_date
    if payload.registration_end_date is not None:
        event.registration_end_date = payload.registration_end_date
    if payload.is_active is not None:
        event.is_active = payload.is_active

    await db.commit()
    await db.refresh(event, ["options"])
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an event by setting is_active = 0"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(Event).where(
        and_(Event.id == event_id, Event.tenant_id == tenant_id)
    )
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    event.is_active = 0
    await db.commit()


# ============================================================================
# EVENT OPTION ENDPOINTS
# ============================================================================


@router.post("/{event_id}/options", response_model=EventOptionOut, status_code=status.HTTP_201_CREATED)
async def add_event_option(
    event_id: str,
    payload: EventOptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an option (track/inventory) to an event"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    # Verify event exists
    event_stmt = select(Event).where(
        and_(Event.id == event_id, Event.tenant_id == tenant_id)
    )
    event_result = await db.execute(event_stmt)
    event = event_result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    option = EventOption(
        id=str(uuid4()),
        tenant_id=tenant_id,
        event_id=event_id,
        option_name=payload.option_name,
        option_type=payload.option_type,
        description=payload.description,
        total_available=payload.total_available,
        cost_per_unit=payload.cost_per_unit,
    )

    db.add(option)
    await db.commit()
    await db.refresh(option)
    return option


@router.get("/{event_id}/options", response_model=List[EventOptionOut])
async def list_event_options(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all options for an event"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(EventOption).where(
        and_(EventOption.event_id == event_id, EventOption.tenant_id == tenant_id)
    )

    result = await db.execute(stmt)
    options = result.scalars().all()
    return options


# ============================================================================
# EVENT REGISTRATION ENDPOINTS
# ============================================================================


@router.post("/{event_id}/register", response_model=EventRegistrationOut, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: str,
    payload: EventRegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a user for an event.
    Performs conflict detection before creating the registration.
    """
    tenant_id = tenancy.CURRENT_TENANT.get()

    # Detect conflicts
    conflict_result = await EventService.detect_conflicts(
        db,
        event_id=event_id,
        user_id=current_user.id,
        event_option_id=payload.event_option_id,
        preferred_pickup_slot=payload.preferred_pickup_slot,
    )

    if conflict_result.has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "conflict_type": conflict_result.conflict_type,
                "message": conflict_result.conflict_message,
                "alternatives": conflict_result.available_alternatives,
            },
        )

    # Generate QR token
    qr_token = str(uuid4())

    # Create registration
    registration = EventRegistration(
        id=str(uuid4()),
        tenant_id=tenant_id,
        event_id=event_id,
        user_id=current_user.id,
        event_option_id=payload.event_option_id,
        qr_token=qr_token,
        preferred_pickup_slot=payload.preferred_pickup_slot,
        notes=payload.notes,
        status=RegistrationStatus.PENDING,
    )

    db.add(registration)
    await db.commit()
    await db.refresh(registration)
    return registration


@router.get("/{event_id}/registrations", response_model=List[EventRegistrationOut])
async def list_event_registrations(
    event_id: str,
    status_filter: Optional[RegistrationStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List registrations for an event.
    Can filter by status.
    """
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(EventRegistration).where(
        and_(EventRegistration.event_id == event_id, EventRegistration.tenant_id == tenant_id)
    )

    if status_filter:
        stmt = stmt.where(EventRegistration.status == status_filter)

    stmt = stmt.offset(skip).limit(limit).order_by(EventRegistration.created_at.desc())

    result = await db.execute(stmt)
    registrations = result.scalars().all()
    return registrations


@router.get("/{event_id}/registrations/{registration_id}", response_model=EventRegistrationOut)
async def get_event_registration(
    event_id: str,
    registration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific registration"""
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(EventRegistration).where(
        and_(
            EventRegistration.id == registration_id,
            EventRegistration.event_id == event_id,
            EventRegistration.tenant_id == tenant_id,
        )
    )

    result = await db.execute(stmt)
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    return registration


@router.put("/{event_id}/registrations/{registration_id}", response_model=EventRegistrationOut)
async def update_registration_status(
    event_id: str,
    registration_id: str,
    payload: EventRegistrationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update registration status (approve/reject/cancel).
    Updates budget and inventory tracking accordingly.
    """
    tenant_id = tenancy.CURRENT_TENANT.get()

    stmt = select(EventRegistration).where(
        and_(
            EventRegistration.id == registration_id,
            EventRegistration.event_id == event_id,
            EventRegistration.tenant_id == tenant_id,
        )
    ).options(selectinload(EventRegistration.event), selectinload(EventRegistration.option))

    result = await db.execute(stmt)
    registration = result.unique().scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    old_status = registration.status
    new_status = payload.status

    # If approving, commit budget and inventory
    if old_status != RegistrationStatus.APPROVED and new_status == RegistrationStatus.APPROVED:
        # Update event budget
        amount = registration.amount_committed or Decimal(0)
        await EventService.update_budget_committed(db, event_id, amount)

        # Update option inventory if applicable
        if registration.event_option_id:
            await EventService.update_option_committed_count(db, registration.event_option_id, 1)

        registration.approved_at = datetime.now()
        registration.approved_by = current_user.id

    # If removing approval (rejection/cancellation), rollback budget and inventory
    elif old_status == RegistrationStatus.APPROVED and new_status != RegistrationStatus.APPROVED:
        # Rollback event budget
        amount = registration.amount_committed or Decimal(0)
        await EventService.update_budget_committed(db, event_id, -amount)

        # Rollback option inventory if applicable
        if registration.event_option_id:
            await EventService.update_option_committed_count(db, registration.event_option_id, -1)

        registration.approved_at = None
        registration.approved_by = None

    registration.status = new_status

    if payload.assigned_pickup_slot:
        registration.assigned_pickup_slot = payload.assigned_pickup_slot
    if payload.notes:
        registration.notes = payload.notes

    await db.commit()
    await db.refresh(registration)
    return registration


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================


@router.get("/{event_id}/budget-variance", response_model=BudgetVarianceResponse)
async def get_budget_variance(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get budget variance report for an event.
    Shows allocated vs committed budget and utilization metrics.
    """
    tenant_id = tenancy.CURRENT_TENANT.get()

    try:
        return await EventService.calculate_budget_variance(db, event_id, tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{event_id}/check-conflicts", response_model=ConflictDetectionResult)
async def check_registration_conflicts(
    event_id: str,
    event_option_id: Optional[str] = None,
    preferred_pickup_slot: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check for conflicts before registering.
    Returns conflict details and available alternatives if conflicts exist.
    """
    return await EventService.detect_conflicts(
        db,
        event_id=event_id,
        user_id=current_user.id,
        event_option_id=event_option_id,
        preferred_pickup_slot=preferred_pickup_slot,
    )
