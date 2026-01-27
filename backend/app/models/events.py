from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, DateTime, Enum as SAEnum, Text, func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base, TenantMixin, TimestampMixin


class EventType(PyEnum):
    """Type of event: Annual Day or Gifting Program"""
    ANNUAL_DAY = "ANNUAL_DAY"
    GIFTING = "GIFTING"


class RegistrationStatus(PyEnum):
    """Status of an event registration"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Event(Base, TenantMixin, TimestampMixin):
    """Event metadata with isolated budget tracking"""
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(SAEnum(EventType, name="event_type"), nullable=False)
    
    # Event budget - isolated per event
    event_budget_amount = Column(Numeric(12, 2), nullable=False)
    budget_committed = Column(Numeric(12, 2), nullable=False, default=0)  # Sum of approved registrations
    
    # Time-based scheduling
    event_date = Column(DateTime(timezone=True), nullable=False)
    registration_start_date = Column(DateTime(timezone=True), nullable=False)
    registration_end_date = Column(DateTime(timezone=True), nullable=False)
    
    is_active = Column(Integer, nullable=False, default=1)  # 1 = active, 0 = archived
    
    created_by = Column(String(36), ForeignKey('users.id'), nullable=True)

    # Relationships
    options = relationship("EventOption", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    pickup_locations = relationship("EventPickupLocation", back_populates="event", cascade="all, delete-orphan")
    created_by_user = relationship("User")

    @property
    def budget_available(self):
        """Calculate remaining budget"""
        return self.event_budget_amount - self.budget_committed


class EventOption(Base, TenantMixin, TimestampMixin):
    """
    Event options: Tracks (Singing/Dancing) or Inventory (Backpacks/Jackets)
    Each option has a stock/capacity limit
    """
    __tablename__ = "event_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey('events.id'), nullable=False)
    
    # Option details
    option_name = Column(String(255), nullable=False)  # e.g., "Singing Track", "Backpack Size M"
    option_type = Column(String(50), nullable=False)  # "TRACK", "INVENTORY", "GIFT"
    description = Column(Text, nullable=True)
    
    # Capacity/stock constraints
    total_available = Column(Integer, nullable=False)  # Total inventory/slots available
    committed_count = Column(Integer, nullable=False, default=0)  # Number committed by approved registrations
    
    # Pricing (optional - for gifting/reward items)
    cost_per_unit = Column(Numeric(10, 2), nullable=True)
    
    # Gifting mode fields
    gift_image_url = Column(String(500), nullable=True)  # URL to uploaded gift image
    
    is_active = Column(Integer, nullable=False, default=1)

    # Relationships
    event = relationship("Event", back_populates="options")
    registrations = relationship("EventRegistration", back_populates="option")

    @property
    def available_slots(self):
        """Calculate remaining slots/inventory"""
        return self.total_available - self.committed_count


class EventPickupLocation(Base, TenantMixin, TimestampMixin):
    """
    Pickup locations for gifting events (e.g., "Conf Room 402", "Main Hall")
    Each location can have multiple time slots with capacity limits
    """
    __tablename__ = "event_pickup_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey('events.id'), nullable=False)
    
    # Location details
    location_name = Column(String(255), nullable=False)  # e.g., "Conference Room 402"
    location_code = Column(String(50), nullable=True)    # e.g., "CR-402"
    description = Column(Text, nullable=True)
    
    # Location metadata
    floor_number = Column(Integer, nullable=True)
    building = Column(String(100), nullable=True)
    capacity = Column(Integer, nullable=False)           # Max concurrent people at location
    
    is_active = Column(Integer, nullable=False, default=1)

    # Relationships
    event = relationship("Event", back_populates="pickup_locations")
    time_slots = relationship("EventTimeSlot", back_populates="location", cascade="all, delete-orphan")


class EventTimeSlot(Base, TenantMixin, TimestampMixin):
    """
    Time slots for pickup at a specific location.
    Each slot has capacity and tracks registrations.
    Example: "15-minute windows with 20-person cap"
    """
    __tablename__ = "event_time_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String(36), ForeignKey('event_pickup_locations.id'), nullable=False)
    event_id = Column(String(36), ForeignKey('events.id'), nullable=False)
    
    # Time slot details
    start_time = Column(DateTime(timezone=True), nullable=False)  # e.g., 2024-07-15 10:00:00
    end_time = Column(DateTime(timezone=True), nullable=False)    # e.g., 2024-07-15 10:15:00
    slot_label = Column(String(100), nullable=False)              # e.g., "10:00 - 10:15"
    
    # Capacity management
    capacity = Column(Integer, nullable=False)                    # e.g., 20 people per 15-min slot
    registered_count = Column(Integer, nullable=False, default=0) # Current registrations for this slot
    
    is_active = Column(Integer, nullable=False, default=1)

    # Relationships
    location = relationship("EventPickupLocation", back_populates="time_slots")
    event = relationship("Event")

    @property
    def available_capacity(self):
        """Calculate remaining capacity for this slot"""
        return self.capacity - self.registered_count


class EventRegistration(Base, TenantMixin, TimestampMixin):
    """
    The "ledger" linking users to event choices.
    Tracks registration status, QR token, and pickup slot information.
    """
    __tablename__ = "event_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey('events.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    event_option_id = Column(String(36), ForeignKey('event_options.id'), nullable=True)
    
    # Registration status
    status = Column(SAEnum(RegistrationStatus, name="registration_status"), nullable=False, default=RegistrationStatus.PENDING)
    
    # QR token for verification/pickup
    qr_token = Column(String(255), nullable=True, unique=True)
    
    # Scheduling/slot information
    preferred_pickup_slot = Column(String(100), nullable=True)  # e.g., "2024-01-15 10:00-11:00"
    assigned_pickup_slot = Column(String(100), nullable=True)   # Assigned by organizer
    
    # Cost/budget tracking
    amount_committed = Column(Numeric(12, 2), nullable=False, default=0)  # Amount reserved from event budget
    
    # Additional metadata
    notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(36), ForeignKey('users.id'), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", foreign_keys=[user_id])
    option = relationship("EventOption", back_populates="registrations")
    approved_by_user = relationship("User", foreign_keys=[approved_by])
