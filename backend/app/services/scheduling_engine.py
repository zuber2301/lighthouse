"""
Scheduling engine for event time slot generation and management
"""

from datetime import datetime, timedelta
from typing import List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.events import EventTimeSlot, EventPickupLocation
from app.schemas.event_wizard import TimeSlotData


class SchedulingEngine:
    """Engine for generating and managing pickup time slots"""

    @staticmethod
    def generate_time_slots(
        event_date: datetime,
        location_id: str,
        event_id: str,
        tenant_id: str,
        slot_duration_minutes: int = 15,
        persons_per_slot: int = 20,
        operating_start_hour: int = 10,
        operating_end_hour: int = 18,
    ) -> List[TimeSlotData]:
        """
        Generate time slots for a pickup location.
        
        Returns list of TimeSlotData objects ready for database insertion.
        
        Example:
        - Event date: 2024-07-15
        - Operating hours: 10:00 - 18:00
        - Slot duration: 15 minutes
        - Persons per slot: 20
        
        Output: 32 slots from 10:00-10:15, 10:15-10:30, ..., 17:45-18:00
        """
        time_slots = []
        
        # Start time is on the event date at operating_start_hour
        current_time = event_date.replace(hour=operating_start_hour, minute=0, second=0, microsecond=0)
        end_of_operations = event_date.replace(hour=operating_end_hour, minute=0, second=0, microsecond=0)
        
        while current_time < end_of_operations:
            slot_start = current_time
            slot_end = current_time + timedelta(minutes=slot_duration_minutes)
            
            # Ensure slot doesn't exceed operating hours
            if slot_end > end_of_operations:
                slot_end = end_of_operations
            
            slot_label = f"{slot_start.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}"
            
            time_slot = TimeSlotData(
                location_id=location_id,
                event_id=event_id,
                tenant_id=tenant_id,
                start_time=slot_start,
                end_time=slot_end,
                slot_label=slot_label,
                capacity=persons_per_slot,
            )
            
            time_slots.append(time_slot)
            current_time = slot_end
        
        return time_slots

    @staticmethod
    async def create_time_slots_for_location(
        db: AsyncSession,
        location_id: str,
        event_id: str,
        tenant_id: str,
        event_date: datetime,
        slot_duration_minutes: int = 15,
        persons_per_slot: int = 20,
        operating_start_hour: int = 10,
        operating_end_hour: int = 18,
    ) -> List[str]:
        """
        Create time slots in database for a pickup location.
        Returns list of created time slot IDs.
        """
        time_slot_data_list = SchedulingEngine.generate_time_slots(
            event_date=event_date,
            location_id=location_id,
            event_id=event_id,
            tenant_id=tenant_id,
            slot_duration_minutes=slot_duration_minutes,
            persons_per_slot=persons_per_slot,
            operating_start_hour=operating_start_hour,
            operating_end_hour=operating_end_hour,
        )
        
        created_ids = []
        for slot_data in time_slot_data_list:
            time_slot = EventTimeSlot(
                id=str(uuid.uuid4()),
                tenant_id=slot_data.tenant_id,
                location_id=slot_data.location_id,
                event_id=slot_data.event_id,
                start_time=slot_data.start_time,
                end_time=slot_data.end_time,
                slot_label=slot_data.slot_label,
                capacity=slot_data.capacity,
            )
            db.add(time_slot)
            created_ids.append(time_slot.id)
        
        await db.flush()
        return created_ids

    @staticmethod
    async def get_available_slots(
        db: AsyncSession,
        location_id: str,
        event_id: str,
    ) -> List[dict]:
        """
        Get all available slots for a location with remaining capacity.
        """
        stmt = select(EventTimeSlot).where(
            (EventTimeSlot.location_id == location_id) &
            (EventTimeSlot.event_id == event_id) &
            (EventTimeSlot.is_active == 1)
        ).order_by(EventTimeSlot.start_time)
        
        result = await db.execute(stmt)
        slots = result.scalars().all()
        
        return [
            {
                "id": slot.id,
                "slot_label": slot.slot_label,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "capacity": slot.capacity,
                "registered": slot.registered_count,
                "available": slot.available_capacity,
                "is_available": slot.available_capacity > 0,
            }
            for slot in slots
        ]

    @staticmethod
    async def register_user_for_slot(
        db: AsyncSession,
        time_slot_id: str,
    ) -> bool:
        """
        Register a user for a time slot.
        Returns True if successful, False if slot is full.
        """
        stmt = select(EventTimeSlot).where(EventTimeSlot.id == time_slot_id)
        result = await db.execute(stmt)
        slot = result.scalar_one_or_none()
        
        if not slot or slot.available_capacity <= 0:
            return False
        
        slot.registered_count += 1
        await db.flush()
        return True

    @staticmethod
    async def unregister_user_from_slot(
        db: AsyncSession,
        time_slot_id: str,
    ) -> bool:
        """
        Unregister a user from a time slot.
        Returns True if successful.
        """
        stmt = select(EventTimeSlot).where(EventTimeSlot.id == time_slot_id)
        result = await db.execute(stmt)
        slot = result.scalar_one_or_none()
        
        if not slot:
            return False
        
        if slot.registered_count > 0:
            slot.registered_count -= 1
        
        await db.flush()
        return True

    @staticmethod
    def validate_slot_configuration(
        slot_duration_minutes: int,
        operating_start_hour: int,
        operating_end_hour: int,
    ) -> Tuple[bool, str]:
        """
        Validate time slot configuration.
        Returns (is_valid, error_message).
        """
        if slot_duration_minutes < 5 or slot_duration_minutes > 60:
            return False, "Slot duration must be between 5 and 60 minutes"
        
        if operating_start_hour < 0 or operating_start_hour >= 24:
            return False, "Start hour must be between 0 and 23"
        
        if operating_end_hour < 0 or operating_end_hour >= 24:
            return False, "End hour must be between 0 and 23"
        
        if operating_end_hour <= operating_start_hour:
            return False, "End hour must be after start hour"
        
        # Check if slot duration divides evenly into operating hours
        total_minutes = (operating_end_hour - operating_start_hour) * 60
        if total_minutes < slot_duration_minutes:
            return False, "Operating hours are shorter than slot duration"
        
        return True, ""

    @staticmethod
    def calculate_slot_statistics(slots: List[EventTimeSlot]) -> dict:
        """
        Calculate statistics for a set of time slots.
        """
        if not slots:
            return {
                "total_slots": 0,
                "total_capacity": 0,
                "total_registered": 0,
                "total_available": 0,
                "utilization_percentage": 0,
            }
        
        total_capacity = sum(slot.capacity for slot in slots)
        total_registered = sum(slot.registered_count for slot in slots)
        total_available = sum(slot.available_capacity for slot in slots)
        utilization = (total_registered / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "total_slots": len(slots),
            "total_capacity": total_capacity,
            "total_registered": total_registered,
            "total_available": total_available,
            "utilization_percentage": round(utilization, 2),
        }
