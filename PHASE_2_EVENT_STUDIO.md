# Phase 2: Event Studio Implementation - Complete Reference

## Overview

Phase 2 delivers a comprehensive **Event Studio Wizard** - a multi-step, mode-conditional interface for tenant admins to create and manage events. The system supports two distinct event modes:

- **Mode A (ANNUAL_DAY)**: Performance tracks and volunteer task coordination
- **Mode B (GIFTING)**: Gift distribution with scheduled pickup locations

## Architecture

### Frontend Components

#### Main Wizard Container
- **File**: [frontend/src/components/EventStudio/EventStudioWizard.jsx](frontend/src/components/EventStudio/EventStudioWizard.jsx)
- **Purpose**: Orchestrates multi-step flow with dynamic step rendering
- **Key Features**:
  - Dynamic step count (4 steps for Annual Day, 5 for Gifting)
  - Progress indicator with completed step markers
  - Error/success message handling
  - Automatic form data persistence via localStorage
  - Step validation before progression

#### Step Components

##### BudgetStep.jsx
- **Location**: `frontend/src/components/EventStudio/steps/BudgetStep.jsx`
- **Step Number**: 1
- **Purpose**: Collect dedicated event budget ("Event Wallet")
- **Fields**:
  - `event_budget_amount` (decimal, required, > 0)
  - `cost_type` (select: CURRENCY or POINTS)
  - `budget_description` (textarea, optional)
- **UI Elements**:
  - Currency input with ₹ prefix
  - Cost type selector
  - Budget summary card (conditional)
  - Explanatory text about separate event wallet

##### BasicInfoStep.jsx
- **Location**: `frontend/src/components/EventStudio/steps/BasicInfoStep.jsx`
- **Step Number**: 2
- **Purpose**: Collect basic event information
- **Fields**:
  - `name` (text, required, 1-255 chars)
  - `description` (textarea, optional)
  - `event_type` (select: ANNUAL_DAY or GIFTING) - **Triggers conditional rendering**
  - `registration_start_date` (datetime, required)
  - `registration_end_date` (datetime, required)
  - `event_date` (datetime, required)
- **Validation**:
  - registration_end_date > registration_start_date
  - event_date > registration_end_date
- **UI Elements**:
  - Event type selector with visual cards (🎭 Annual Day, 🎁 Gifting)
  - Datetime pickers for date range
  - Event preview card with formatted dates

##### OptionsStep.jsx
- **Location**: `frontend/src/components/EventStudio/steps/OptionsStep.jsx`
- **Step Number**: 3
- **Purpose**: Collect mode-specific options (conditional rendering)
- **Annual Day Mode**:
  - `tracks` (array of PerformanceTrack)
    - track_name, total_slots, duration_minutes, description
  - `volunteer_tasks` (array of VolunteerTask)
    - task_name, required_volunteers, duration_minutes, description
  - Requirements: At least 1 track OR task
- **Gifting Mode**:
  - `gift_items` (array of GiftItem)
    - item_name, total_quantity, unit_cost, gift_image_url, description
  - Requirements: Each gift must have image + cost > 0
- **UI Features**:
  - Add/Remove buttons for dynamic list management
  - Image upload with 5MB limit, image/* validation
  - Image preview with delete capability
  - Live cost calculations (unit_cost × quantity)
  - Summary card showing totals

##### SchedulingStep.jsx
- **Location**: `frontend/src/components/EventStudio/steps/SchedulingStep.jsx`
- **Step Number**: 4 (Gifting mode only)
- **Purpose**: Configure pickup locations and time slot generation
- **Sections**:
  1. **Time Slot Configuration**:
     - `slot_duration_minutes` (5-60, step 5)
     - `persons_per_slot` (1-50)
     - `operating_start_hour` (0-23)
     - `operating_end_hour` (0-23)
     - Preview: Calculates expected slots per location
  2. **Pickup Locations**:
     - `location_name`, `location_code`, `floor_number`, `building`, `capacity`
     - Collapsible form for each location
     - Add/Remove location buttons
- **Summary**: Total locations, total slots, total capacity

##### ReviewStep.jsx
- **Location**: `frontend/src/components/EventStudio/steps/ReviewStep.jsx`
- **Step Number**: 4 (Annual Day) or 5 (Gifting)
- **Purpose**: Final review of all configuration
- **Displays**:
  - Budget summary (amount, type, description)
  - Event info (name, type, dates)
  - Mode-specific items:
    - Annual Day: Tracks with slots, tasks with volunteers
    - Gifting: Gift items with images, pickup locations with slot config
  - Submit button with loading state
  - Pre-submission checklist

### State Management Hook

#### useEventWizardForm.js
- **Location**: `frontend/src/hooks/useEventWizardForm.js`
- **Purpose**: Centralized form state management with validation
- **Features**:
  - useState-based state management
  - localStorage persistence (auto-save on changes)
  - Step-specific validation (Steps 1-4)
  - Field-level error tracking
  - Touch state tracking
  - Form clearance capability
- **Methods**:
  ```javascript
  const {
    formData,              // Current form data object
    updateFormData,        // Update formData (accepts fn or object)
    clearForm,             // Clear form and localStorage
    errors,                // Current validation errors
    touched,               // Fields user has interacted with
    validateAndSetErrors,  // Validate step and set errors
    getFieldError,         // Get error if field is touched
    validateBudget,        // Step 1 validation
    validateEventInfo,     // Step 2 validation
    validateAnnualDayOptions,  // Step 3A validation
    validateGiftingOptions,    // Step 3B validation
    validateScheduling     // Step 4 validation
  } = useEventWizardForm();
  ```

### API Service Layer

#### eventWizardAPI.js
- **Location**: `frontend/src/services/eventWizardAPI.js`
- **Base URL**: `/api/v1/events/wizard`
- **Methods**:

```javascript
// Validation endpoints
await eventWizardAPI.validateBudget(payload);
await eventWizardAPI.validateEventInfo(payload);
await eventWizardAPI.validateAnnualDayOptions(payload);
await eventWizardAPI.validateGiftingOptions(payload);
await eventWizardAPI.validateScheduling(payload);

// File upload
const result = await eventWizardAPI.uploadGiftImage(file);
// Returns: { file_key, url, content_type, size_bytes, uploaded_at }

// Final submission
const response = await eventWizardAPI.submitEvent(payload);
// Returns: { event_id, name, event_type, budget_amount, ... }

// Helper function
const payload = prepareSubmissionPayload(formData);
```

## Backend Implementation

### Database Models

#### Event (Extended)
```python
class Event(Base):
    __tablename__ = "events"
    
    # Phase 1 fields (existing)
    id, tenant_id, name, description, event_type
    
    # Phase 2 additions
    pickup_locations: Relationship  # One-to-many with EventPickupLocation
```

#### EventOption (Extended)
```python
class EventOption(Base):
    # Phase 1 fields (existing)
    id, event_id, option_type, option_name, cost_per_unit, ...
    
    # Phase 2 addition
    gift_image_url: str  # URL to uploaded gift image
```

#### EventPickupLocation (NEW)
```python
class EventPickupLocation(Base):
    __tablename__ = "event_pickup_locations"
    
    id: int
    event_id: int (FK to events)
    tenant_id: int (FK, for multi-tenancy)
    location_name: str  # e.g., "Conference Room 402"
    location_code: str  # e.g., "CONF-402"
    floor_number: str   # e.g., "4"
    building: str       # e.g., "Corporate Tower A"
    capacity: int       # Physical capacity for validation
    
    # Relationships
    event: Relationship  # Back to Event
    time_slots: Relationship  # One-to-many with EventTimeSlot (cascade delete)
```

#### EventTimeSlot (NEW)
```python
class EventTimeSlot(Base):
    __tablename__ = "event_time_slots"
    
    id: int
    event_id: int (FK)
    location_id: int (FK to event_pickup_locations)
    tenant_id: int (FK)
    start_time: datetime
    end_time: datetime
    slot_label: str  # e.g., "10:00 AM - 10:15 AM"
    capacity: int    # Max people per slot
    registered_count: int  # Current registrations
    
    @property
    available_capacity: int  # capacity - registered_count
```

### Database Migration

- **File**: `backend/migrations/versions/0016_add_gifting_support.py`
- **Operations**:
  1. Add `gift_image_url` column to event_options
  2. Create `event_pickup_locations` table with:
     - Indices on tenant_id, event_id, location_code
     - Foreign key to events (cascade delete)
  3. Create `event_time_slots` table with:
     - Indices on tenant_id, event_id, location_id
     - Foreign keys to events and event_pickup_locations
     - Check constraint: start_time < end_time
  4. Both operations include downgrade logic

### Pydantic Schemas

- **File**: `backend/app/schemas/event_wizard.py`
- **Contains**: 25+ schema classes for validation

#### Step 1: Budget
```python
class EventBudgetStep(BaseModel):
    event_budget_amount: Decimal  # > 0
    cost_type: str  # "CURRENCY" or "POINTS"
    budget_description: Optional[str] = ""
```

#### Step 2: Event Info
```python
class EventBasicInfoStep(BaseModel):
    name: str  # 1-255 chars
    description: Optional[str] = ""
    event_type: str  # "ANNUAL_DAY" or "GIFTING"
    event_date: datetime
    registration_start_date: datetime
    registration_end_date: datetime
    
    @validator('registration_end_date')
    def end_after_start(cls, v, values):
        # registration_end_date > registration_start_date
```

#### Step 3A: Annual Day Options
```python
class PerformanceTrack(BaseModel):
    track_name: str
    total_slots: int  # > 0
    duration_minutes: int
    description: Optional[str]

class VolunteerTask(BaseModel):
    task_name: str
    required_volunteers: int  # > 0
    duration_minutes: int
    description: Optional[str]

class AnnualDayOptionsStep(BaseModel):
    tracks: List[PerformanceTrack]
    volunteer_tasks: List[VolunteerTask]
    
    @validator('tracks', 'volunteer_tasks')
    def at_least_one_option(cls, v, values):
        # At least 1 track OR task
```

#### Step 3B: Gifting Options
```python
class GiftItem(BaseModel):
    item_name: str
    total_quantity: int  # > 0
    unit_cost: Decimal   # >= 0
    gift_image_url: Optional[str]  # URL or empty
    image_file_key: Optional[str]  # Upload key or empty
    description: Optional[str]

class GiftingOptionsStep(BaseModel):
    gift_items: List[GiftItem]
    
    @validator('gift_items')
    def all_have_images_and_costs(cls, v):
        # Each gift must have image_url OR image_file_key
```

#### Step 4: Scheduling
```python
class TimeSlotGenerationConfig(BaseModel):
    slot_duration_minutes: int  # 5-60
    persons_per_slot: int       # >= 1
    operating_start_hour: int   # 0-23
    operating_end_hour: int     # 0-23
    
    @validator('operating_end_hour')
    def end_after_start_hour(cls, v, values):
        # operating_end_hour > operating_start_hour

class PickupLocationInput(BaseModel):
    location_name: str
    location_code: Optional[str]
    floor_number: Optional[str]
    building: Optional[str]
    capacity: int

class SchedulingStep(BaseModel):
    pickup_locations: List[PickupLocationInput]
    slot_generation_config: TimeSlotGenerationConfig
```

#### Complete Submission
```python
class EventWizardComplete(BaseModel):
    # All fields from steps 1-4, combined
    event_budget_amount: Decimal
    cost_type: str
    budget_description: Optional[str]
    name: str
    description: Optional[str]
    event_type: str
    event_date: datetime
    registration_start_date: datetime
    registration_end_date: datetime
    
    # Step 3 fields (mutually exclusive based on event_type)
    tracks: Optional[List[PerformanceTrack]]
    volunteer_tasks: Optional[List[VolunteerTask]]
    gift_items: Optional[List[GiftItem]]
    
    # Step 4 (Gifting only)
    pickup_locations: Optional[List[PickupLocationInput]]
    slot_generation_config: Optional[TimeSlotGenerationConfig]
```

### Business Logic Service

#### SchedulingEngine
- **File**: `backend/app/services/scheduling_engine.py`
- **Purpose**: Time slot generation and capacity management

**Methods**:

1. **generate_time_slots()**
   - **Input**: event_date, slot_duration_minutes, start_hour, end_hour, persons_per_slot
   - **Output**: List[TimeSlotData]
   - **Logic**:
     - Creates 15-min (or configured) slots between operating hours
     - Example: 10:00-18:00 with 15-min slots = 32 slots
     - Returns: start_time, end_time, slot_label, capacity
   - **Validation**: Ensures duration divides evenly into hours

2. **create_time_slots_for_location()**
   - **Input**: location_id, event_date, slot_config
   - **Output**: List[int] (slot IDs)
   - **Operation**: Persists generated slots to database

3. **get_available_slots()**
   - **Input**: location_id
   - **Output**: List[dict] with id, slot_label, capacity, registered_count, available_capacity, is_available
   - **Filter**: Only returns is_available = True slots

4. **register_user_for_slot()**
   - **Input**: user_id, slot_id
   - **Operation**: Increments registered_count
   - **Validation**: Checks available_capacity > 0
   - **Return**: Boolean (success)

5. **validate_slot_configuration()**
   - **Input**: slot_config
   - **Output**: (bool, error_message)
   - **Checks**:
     - duration 5-60 min
     - start/end hours 0-23
     - end > start
     - duration divides hours evenly

6. **calculate_slot_statistics()**
   - **Output**: {total_slots, total_capacity, total_registered, utilization_percentage}

### API Router

- **File**: `backend/app/api/event_studio.py`
- **Prefix**: `/api/v1/events/wizard`
- **Authentication**: Requires authenticated user + tenant context

#### Endpoints

##### POST `/step1/budget`
- **Validation**: EventBudgetStep
- **Response**: `{step: 1, status: "COMPLETED", budget_amount, message}`

##### POST `/step2/event-info`
- **Validation**: EventBasicInfoStep with date validations
- **Response**: `{step: 2, status: "COMPLETED", event_name, event_type, message}`

##### POST `/step3/options/annual-day`
- **Validation**: AnnualDayOptionsStep
- **Response**: `{step: 3, tracks_count, tasks_count, total_slots, total_volunteers, message}`

##### POST `/step3/options/gifting`
- **Validation**: GiftingOptionsStep (images required)
- **Response**: `{step: 3, gifts_count, total_gifts, total_gift_value, message}`

##### POST `/upload-gift-image`
- **Input**: File upload (multipart/form-data)
- **Validation**:
  - Content-Type: starts with "image/"
  - Size: <= 5MB
- **Storage**: Saves to `uploads/gifts/{uuid}.ext`
- **Response**: ImageUploadResponse
  ```json
  {
    "file_key": "uuid",
    "url": "/uploads/gifts/uuid.jpg",
    "content_type": "image/jpeg",
    "size_bytes": 45000,
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
  ```

##### POST `/step4/scheduling`
- **Input**: SchedulingStep
- **Validation**: Via SchedulingEngine.validate_slot_configuration()
- **Calculations**:
  - expected_slots_per_location = (end_hour - start_hour) * (60 / duration)
  - total_capacity = expected_slots × persons_per_slot × locations_count
- **Response**: `{step: 4, locations_count, slot_duration_minutes, expected_slots_per_location, total_capacity, message}`

##### POST `/submit`
- **Input**: EventWizardComplete (all fields merged)
- **Operation**: Cascading create with full transaction
  ```
  1. Create Event record
  2. Create EventOption records (tracks/tasks/gifts)
  3. Create EventPickupLocation records (if gifting)
  4. Generate & create EventTimeSlot records (if gifting)
  5. Commit transaction
  ```
- **Response**: EventWizardResponse
  ```json
  {
    "event_id": "uuid",
    "name": "Annual Day 2024",
    "event_type": "ANNUAL_DAY",
    "budget_amount": "50000",
    "budget_committed": "0",
    "status": "CREATED",
    "total_options": 5,
    "total_pickup_locations": 0,
    "total_time_slots": 0
  }
  ```
- **Error Handling**: Full rollback on any exception

##### GET `/events/{event_id}/preview`
- **Purpose**: Retrieve complete event configuration
- **Eager Loading**: options, pickup_locations, time_slots
- **Response**: Nested JSON with all configuration

## Integration Points

### Main Application File
- **File**: `backend/app/main.py`
- **Changes**:
  - Import: `from app.api import event_studio`
  - Registration: `app.include_router(event_studio.router, prefix="/api/v1")`

### Models Export
- **File**: `backend/app/models/__init__.py`
- **Additions**:
  - Export `EventPickupLocation`, `EventTimeSlot` in `__all__`

## Wizard Flow Examples

### Annual Day Workflow
```
Step 1: Budget Loading
├─ Input: Budget amount (₹50,000), Cost type (CURRENCY)
└─ Output: Budget validated

Step 2: Event Details
├─ Input: Name, Description, Type (ANNUAL_DAY)
├─ Input: Registration dates, Event date
└─ Output: Dates validated

Step 3: Configure Options
├─ Input: 2 Performance Tracks (Dance, Music)
├─ Input: 2 Volunteer Tasks (Setup, Ushering)
└─ Output: Total 4 slots, 3 volunteers needed

Step 4: Review & Submit
├─ Display: All configuration
├─ Action: Submit event
└─ Output: Event created with ID
```

### Gifting Workflow
```
Step 1: Budget Loading
├─ Input: Budget (₹100,000), Type (CURRENCY)
└─ Output: Budget validated

Step 2: Event Details
├─ Input: Name, Type (GIFTING), Dates
└─ Output: Dates validated

Step 3: Configure Gifts
├─ Input: 3 Gift items with images
├─ Upload: Gift images (JPEG/PNG)
├─ Costs: Mug (₹200 × 100), Backpack (₹500 × 50)
└─ Output: Total 150 gifts, ₹45,000 value

Step 4: Configure Scheduling
├─ Input: Time slot config (15-min slots, 20 people)
├─ Input: 2 Pickup locations (Conf Room 402, Main Lobby)
├─ Calculate: 32 slots/location, 1,280 total capacity
└─ Output: Scheduling validated

Step 5: Review & Submit
├─ Display: All configuration
├─ Action: Submit event
└─ Output: Event + locations + time slots created
```

## Testing Guide

### Manual Testing Checklist

- [ ] **Step 1**: Budget validation (required fields, positive amount)
- [ ] **Step 2**: Event type selection triggers conditional rendering
- [ ] **Step 2**: Date validation (end > start, event > registration end)
- [ ] **Step 3**: Annual Day - add/remove tracks and tasks
- [ ] **Step 3**: Gifting - upload images, calculate costs
- [ ] **Step 4** (Gifting): Configure slot times, add locations
- [ ] **Step 4** (Gifting): Verify slot calculation matches formula
- [ ] **Step 5**: Review displays correct configuration
- [ ] **Final**: Event created successfully, redirect to details page
- [ ] **localStorage**: Form data persists on page reload (before submission)

### API Testing Examples

```bash
# Step 1: Validate Budget
curl -X POST http://localhost:8000/api/v1/events/wizard/step1/budget \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_budget_amount": 50000,
    "cost_type": "CURRENCY",
    "budget_description": "Annual Day 2024"
  }'

# Step 2: Validate Event Info
curl -X POST http://localhost:8000/api/v1/events/wizard/step2/event-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Annual Day 2024",
    "description": "Company celebration",
    "event_type": "ANNUAL_DAY",
    "registration_start_date": "2024-01-15T00:00:00Z",
    "registration_end_date": "2024-01-20T23:59:59Z",
    "event_date": "2024-01-25T09:00:00Z"
  }'

# Upload Gift Image
curl -X POST http://localhost:8000/api/v1/events/wizard/upload-gift-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/gift.jpg"

# Final Submission
curl -X POST http://localhost:8000/api/v1/events/wizard/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...all form data...}'
```

## Performance Considerations

1. **Form Persistence**: localStorage reduces API calls for validation during development
2. **Image Upload**: 5MB limit and image/* validation prevent server overload
3. **Time Slot Generation**: Algorithm optimized to generate 32+ slots efficiently
4. **Database Indices**: Composite indices on (event_id, location_id) for slot queries
5. **Cascade Deletes**: Locations deleted with event ensure data integrity

## Security Considerations

1. **Multi-tenancy**: All queries filtered by tenant_id (enforced at router level)
2. **File Upload**: Content-type and size validation prevent malicious uploads
3. **CSRF Protection**: POST endpoints use standard CSRF middleware
4. **Date Validation**: Server-side validation prevents logical conflicts
5. **Capacity Limits**: Persons per slot validation prevents overselling

## Migration Instructions

To apply Phase 2 changes:

```bash
# Run pending migrations
cd backend
python -m alembic upgrade head

# Verify new tables
python -c "from app.models import EventPickupLocation, EventTimeSlot; print('Models imported successfully')"
```

## File Structure Summary

```
frontend/
├── src/
│   ├── components/
│   │   └── EventStudio/
│   │       ├── EventStudioWizard.jsx (main container)
│   │       └── steps/
│   │           ├── BudgetStep.jsx
│   │           ├── BasicInfoStep.jsx
│   │           ├── OptionsStep.jsx
│   │           ├── SchedulingStep.jsx
│   │           └── ReviewStep.jsx
│   ├── hooks/
│   │   └── useEventWizardForm.js (state management)
│   └── services/
│       └── eventWizardAPI.js (API layer)

backend/
├── app/
│   ├── api/
│   │   └── event_studio.py (router with 8 endpoints)
│   ├── models/
│   │   └── events.py (extended models)
│   ├── schemas/
│   │   └── event_wizard.py (25+ validation schemas)
│   └── services/
│       └── scheduling_engine.py (business logic)
└── migrations/
    └── versions/
        └── 0016_add_gifting_support.py (database migration)
```

## Success Criteria

✅ Multi-step wizard with 4-5 steps based on event type
✅ Conditional UI rendering based on ANNUAL_DAY vs GIFTING mode
✅ Image upload with validation and preview
✅ Time slot generation with configurable parameters
✅ Complete form state persistence
✅ Comprehensive step-by-step validation
✅ Cascading event creation with all related objects
✅ Responsive UI with progress indication
✅ Error handling and user feedback

---

**Last Updated**: January 2024
**Implementation Status**: Phase 2 Complete - Ready for Testing
