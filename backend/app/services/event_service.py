"""
Service layer for event management: budget variance, conflict detection, and registration logic.
"""

from decimal import Decimal
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.events import Event, EventOption, EventRegistration, RegistrationStatus, EventType
from app.models.users import User
from app.schemas.events import (
    BudgetVarianceResponse,
    EventOptionVariance,
    ConflictDetectionResult,
)


class EventService:
    """Service for event-related business logic"""

    @staticmethod
    async def calculate_budget_variance(
        db: AsyncSession, event_id: str, tenant_id: str
    ) -> BudgetVarianceResponse:
        """
        Calculate budget variance for an event.
        Returns allocated vs committed budget with utilization details.
        """
        # Fetch event with eager loading
        stmt = select(Event).where(
            and_(Event.id == event_id, Event.tenant_id == tenant_id)
        ).options(selectinload(Event.options), selectinload(Event.registrations))
        
        result = await db.execute(stmt)
        event = result.scalar_one_or_none()
        
        if not event:
            raise ValueError(f"Event {event_id} not found")

        # Count registrations by status
        reg_stmt = select(
            func.count(EventRegistration.id).label("total"),
            func.sum(
                case(
                    (EventRegistration.status == RegistrationStatus.APPROVED, 1),
                    else_=0
                )
            ).label("approved"),
            func.sum(
                case(
                    (EventRegistration.status == RegistrationStatus.PENDING, 1),
                    else_=0
                )
            ).label("pending"),
        ).where(EventRegistration.event_id == event_id)

        reg_result = await db.execute(reg_stmt)
        reg_row = reg_result.first()

        total_registrations = reg_row.total or 0
        approved_count = reg_row.approved or 0
        pending_count = reg_row.pending or 0

        # Calculate utilization percentage
        budget_amount = event.event_budget_amount
        budget_committed = event.budget_committed
        utilization_pct = (
            float(budget_committed / budget_amount * 100) if budget_amount > 0 else 0
        )

        # Calculate option variance
        option_variance: List[EventOptionVariance] = []
        for option in event.options:
            utilization = (
                float(option.committed_count / option.total_available * 100)
                if option.total_available > 0
                else 0
            )
            option_variance.append(
                EventOptionVariance(
                    option_id=option.id,
                    option_name=option.option_name,
                    total_available=option.total_available,
                    committed_count=option.committed_count,
                    available_slots=option.available_slots,
                    utilization_percentage=utilization,
                )
            )

        return BudgetVarianceResponse(
            event_id=event.id,
            event_name=event.name,
            total_budget=budget_amount,
            budget_committed=budget_committed,
            budget_available=event.budget_available,
            utilization_percentage=utilization_pct,
            registered_users_count=total_registrations,
            approved_registrations_count=approved_count,
            pending_registrations_count=pending_count,
            option_variance=option_variance,
        )

    @staticmethod
    async def detect_conflicts(
        db: AsyncSession,
        event_id: str,
        user_id: str,
        event_option_id: Optional[str],
        preferred_pickup_slot: Optional[str],
    ) -> ConflictDetectionResult:
        """
        Detect conflicts before approving a registration.
        Checks for:
        1. Inventory exhaustion
        2. Time slot overbooking
        3. Budget availability
        """
        # Fetch event
        event_stmt = select(Event).where(Event.id == event_id)
        event_result = await db.execute(event_stmt)
        event = event_result.scalar_one_or_none()

        if not event:
            return ConflictDetectionResult(
                has_conflict=True,
                conflict_type="INVALID_EVENT",
                conflict_message="Event not found",
            )

        # Check if event registration window is open
        now = datetime.now()
        if now < event.registration_start_date or now > event.registration_end_date:
            return ConflictDetectionResult(
                has_conflict=True,
                conflict_type="REGISTRATION_CLOSED",
                conflict_message="Registration window is closed for this event",
            )

        # Check budget availability
        if event.budget_available <= 0:
            return ConflictDetectionResult(
                has_conflict=True,
                conflict_type="BUDGET_EXHAUSTED",
                conflict_message="Event budget has been exhausted",
            )

        # If option selected, check inventory
        if event_option_id:
            option_stmt = select(EventOption).where(
                EventOption.id == event_option_id
            )
            option_result = await db.execute(option_stmt)
            option = option_result.scalar_one_or_none()

            if not option:
                return ConflictDetectionResult(
                    has_conflict=True,
                    conflict_type="INVALID_OPTION",
                    conflict_message="Selected event option not found",
                )

            if option.available_slots <= 0:
                # Find available alternatives
                alternatives = await EventService._get_available_options(
                    db, event_id, option.option_type
                )
                return ConflictDetectionResult(
                    has_conflict=True,
                    conflict_type="INVENTORY_EXHAUSTED",
                    conflict_message=f"No inventory available for {option.option_name}",
                    available_alternatives=alternatives,
                )

        # Check for time slot conflicts
        if preferred_pickup_slot:
            conflict = await EventService._check_time_slot_conflict(
                db, event_id, preferred_pickup_slot
            )
            if conflict:
                available_slots = await EventService._get_available_pickup_slots(
                    db, event_id
                )
                return ConflictDetectionResult(
                    has_conflict=True,
                    conflict_type="SLOT_CONFLICT",
                    conflict_message=f"Pickup slot {preferred_pickup_slot} is fully booked",
                    available_alternatives=available_slots,
                )

        # No conflicts detected
        return ConflictDetectionResult(
            has_conflict=False,
            conflict_type=None,
            conflict_message=None,
        )

    @staticmethod
    async def _get_available_options(
        db: AsyncSession, event_id: str, option_type: str
    ) -> List[str]:
        """Get list of available options of a given type"""
        stmt = select(EventOption).where(
            and_(
                EventOption.event_id == event_id,
                EventOption.option_type == option_type,
                EventOption.is_active == 1,
            )
        )
        result = await db.execute(stmt)
        options = result.scalars().all()

        return [
            f"{opt.option_name} ({opt.available_slots} slots)"
            for opt in options
            if opt.available_slots > 0
        ]

    @staticmethod
    async def _check_time_slot_conflict(
        db: AsyncSession, event_id: str, pickup_slot: str
    ) -> bool:
        """
        Check if a pickup slot is overbooked.
        Assumes max 10 people per slot (configurable).
        """
        MAX_PER_SLOT = 10

        stmt = select(func.count(EventRegistration.id)).where(
            and_(
                EventRegistration.event_id == event_id,
                EventRegistration.assigned_pickup_slot == pickup_slot,
                EventRegistration.status == RegistrationStatus.APPROVED,
            )
        )
        result = await db.execute(stmt)
        count = result.scalar() or 0

        return count >= MAX_PER_SLOT

    @staticmethod
    async def _get_available_pickup_slots(db: AsyncSession, event_id: str) -> List[str]:
        """
        Get list of available pickup slots.
        Assumes slots follow pattern: "YYYY-MM-DD HH:00-HH:59"
        """
        MAX_PER_SLOT = 10

        # Query all slots used in registrations for this event
        stmt = select(EventRegistration.assigned_pickup_slot).where(
            and_(
                EventRegistration.event_id == event_id,
                EventRegistration.status == RegistrationStatus.APPROVED,
            )
        ).distinct()

        result = await db.execute(stmt)
        used_slots = set(row[0] for row in result.fetchall() if row[0])

        # Generate all possible slots (8 AM - 6 PM in 1-hour intervals)
        # This is a simplified example; adjust based on your event needs
        available = []
        for hour in range(8, 18):
            slot = f"10:00-18:00 {hour:02d}:00-{hour+1:02d}:00"  # Simplified
            slot_count = 0
            for used_slot in used_slots:
                if hour == int(used_slot.split()[-1].split(":")[0]):
                    slot_count += 1

            if slot_count < MAX_PER_SLOT:
                available.append(f"{hour:02d}:00-{hour+1:02d}:00 ({MAX_PER_SLOT - slot_count} available)")

        return available if available else ["No slots available"]

    @staticmethod
    async def update_budget_committed(
        db: AsyncSession, event_id: str, delta: Decimal
    ) -> None:
        """
        Update the budget_committed amount for an event.
        Called when a registration is approved.
        """
        stmt = select(Event).where(Event.id == event_id)
        result = await db.execute(stmt)
        event = result.scalar_one()

        event.budget_committed = (event.budget_committed or Decimal(0)) + delta
        await db.flush()

    @staticmethod
    async def update_option_committed_count(
        db: AsyncSession, event_option_id: str, delta: int
    ) -> None:
        """
        Update the committed_count for an event option.
        Called when a registration is approved/cancelled.
        """
        stmt = select(EventOption).where(EventOption.id == event_option_id)
        result = await db.execute(stmt)
        option = result.scalar_one()

        option.committed_count = max(0, (option.committed_count or 0) + delta)
        await db.flush()
